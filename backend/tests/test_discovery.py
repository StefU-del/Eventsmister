import asyncio
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import httpx
import pytest

from app import schemas
from app.routers import discovery
from app.services import external_events
from app.services.external_events import (
    ExternalEventSettings,
    GeminiSearchResult,
    clear_external_event_cache,
    discover_external_events,
    fetch_gemini_events,
    parse_gemini_events,
    parse_skiddle_events,
    parse_ticketmaster_events,
)
from tests.database_setup import client


pytestmark = pytest.mark.api


def external_event(source: str = "skiddle") -> schemas.ExternalEventResponse:
    source_names = {
        "skiddle": "Skiddle",
        "ticketmaster": "Ticketmaster",
        "gemini": "Google Search",
    }
    return schemas.ExternalEventResponse(
        external_id=f"{source}-1",
        source=source,
        source_name=source_names[source],
        source_url=f"https://events.example/{source}-1",
        title=f"{source_names[source]} jazz night",
        description="A real London event.",
        category="Music",
        location="London",
        image_url="https://images.example/event.jpg",
        event_date="2030-08-20T19:30:00Z",
    )


def test_skiddle_payload_is_normalised_and_active_html_is_removed():
    events = parse_skiddle_events(
        {
            "results": [
                {
                    "id": 71,
                    "eventname": "London Five-a-side",
                    "description": "<script>alert('no')</script><p>Friendly game.</p>",
                    "EventCode": "SPORT",
                    "startdate": "2030-08-20T18:00:00+00:00",
                    "link": "https://www.skiddle.com/events/71",
                    "largeimage": "https://images.skiddle.com/event.jpg",
                    "venue": {
                        "name": "Community Pitch",
                        "town": "London",
                        "postcode": "E8 1AA",
                    },
                }
            ]
        }
    )

    assert len(events) == 1
    assert events[0].category == "Sports"
    assert events[0].description == "Friendly game."
    assert events[0].location == "Community Pitch, London, E8 1AA"
    assert events[0].source_name == "Skiddle"
    assert "logo_vertical_rebrand.svg" in events[0].source_logo_url


def test_ticketmaster_payload_uses_the_largest_wide_image():
    events = parse_ticketmaster_events(
        {
            "_embedded": {
                "events": [
                    {
                        "id": "tm-9",
                        "name": "Riverside run",
                        "url": "https://ticketmaster.example/tm-9",
                        "info": "A social run along the Thames.",
                        "dates": {"start": {"dateTime": "2030-08-22T09:00:00Z"}},
                        "classifications": [{"segment": {"name": "Sports"}}],
                        "images": [
                            {
                                "url": "https://images.example/small.jpg",
                                "ratio": "16_9",
                                "width": 640,
                            },
                            {
                                "url": "https://images.example/large.jpg",
                                "ratio": "16_9",
                                "width": 1600,
                            },
                        ],
                        "_embedded": {
                            "venues": [
                                {
                                    "name": "South Bank",
                                    "address": {"line1": "Belvedere Road"},
                                    "city": {"name": "London"},
                                }
                            ]
                        },
                    }
                ]
            }
        }
    )

    assert len(events) == 1
    assert events[0].image_url == "https://images.example/large.jpg"
    assert events[0].location == "South Bank, Belvedere Road, London"


def test_gemini_payload_keeps_only_valid_future_events():
    response_text = json.dumps(
        [
            {
                "title": "Grounded pottery class",
                "description": "A class listed by the organiser.",
                "category": "Arts",
                "location": "Peckham, London",
                "event_date": "2030-09-01T13:00:00Z",
                "source_url": "https://organiser.example/pottery",
            },
            {
                "title": "Old listing",
                "description": "Already happened.",
                "category": "Arts",
                "location": "London",
                "event_date": "2020-01-01T13:00:00Z",
                "source_url": "https://organiser.example/old",
            },
        ]
    )
    events = parse_gemini_events(
        {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": f"```json\n{response_text}\n```"}]
                    },
                    "groundingMetadata": {
                        "groundingChunks": [
                            {
                                "web": {
                                    "uri": "https://grounded.example/pottery",
                                    "title": "Pottery organiser",
                                }
                            }
                        ],
                        "groundingSupports": [
                            {
                                "segment": {
                                    "startIndex": 0,
                                    "endIndex": len(response_text),
                                    "text": "Grounded pottery class",
                                },
                                "groundingChunkIndices": [0],
                            }
                        ],
                    },
                }
            ]
        },
        now=datetime(2026, 7, 16, tzinfo=timezone.utc),
    )

    assert len(events) == 1
    assert events[0].title == "Grounded pottery class"
    assert events[0].source == "gemini"
    assert events[0].source_name == "Google Search"
    assert events[0].source_url == "https://grounded.example/pottery"
    assert events[0].image_url is None


def test_gemini_request_returns_grounding_attribution():
    response_text = json.dumps(
        [
            {
                "title": "London print fair",
                "description": "Independent printmakers in one venue.",
                "category": "Arts",
                "location": "London",
                "event_date": "2030-10-12T11:00:00Z",
                "source_url": "https://organiser.example/print-fair",
            }
        ]
    )

    def gemini_response(request: httpx.Request) -> httpx.Response:
        request_body = json.loads(request.content)
        assert request.headers["x-goog-api-key"] == "gemini-key"
        assert request.url.path.endswith("/models/gemini-test:generateContent")
        assert request_body["tools"] == [{"google_search": {}}]
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {"parts": [{"text": response_text}]},
                        "groundingMetadata": {
                            "searchEntryPoint": {
                                "renderedContent": "<div>Search suggestions</div>"
                            }
                        },
                    }
                ]
            },
        )

    async def make_request():
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(gemini_response)
        ) as http_client:
            return await fetch_gemini_events(
                http_client,
                api_key="gemini-key",
                model="gemini-test",
                terms=["printmaking"],
                limit=4,
            )

    result = asyncio.run(make_request())

    assert [event.title for event in result.events] == ["London print fair"]
    assert result.search_suggestions_html == "<div>Search suggestions</div>"


def test_external_discovery_combines_partial_provider_results(monkeypatch):
    clear_external_event_cache()

    async def skiddle_result(*_args, **_kwargs):
        return [external_event("skiddle")]

    async def ticketmaster_timeout(*_args, **_kwargs):
        raise httpx.TimeoutException("provider timeout")

    async def gemini_result(*_args, **_kwargs):
        return GeminiSearchResult(
            events=[external_event("gemini")],
            search_suggestions_html="<div>Google Search suggestions</div>",
        )

    monkeypatch.setattr(external_events, "fetch_skiddle_events", skiddle_result)
    monkeypatch.setattr(
        external_events,
        "fetch_ticketmaster_events",
        ticketmaster_timeout,
    )
    monkeypatch.setattr(external_events, "fetch_gemini_events", gemini_result)

    result = asyncio.run(
        discover_external_events(
            query="jazz",
            interests=["music"],
            settings=ExternalEventSettings(
                skiddle_api_key="skiddle-key",
                ticketmaster_api_key="ticketmaster-key",
                gemini_api_key="gemini-key",
                gemini_model="gemini-test",
                cache_seconds=60,
                request_timeout_seconds=2,
            ),
        )
    )

    assert {event.source for event in result.events} == {"skiddle", "gemini"}
    assert result.terms == ["jazz", "music"]
    statuses = {status.source: status for status in result.providers}
    assert statuses["skiddle"].returned == 1
    assert statuses["ticketmaster"].error == "The provider timed out."
    assert statuses["gemini"].returned == 1
    assert result.search_suggestions_html == "<div>Google Search suggestions</div>"


def test_grounded_searches_are_not_cached(monkeypatch):
    clear_external_event_cache()
    call_count = 0

    async def gemini_result(*_args, **_kwargs):
        nonlocal call_count
        call_count += 1
        return GeminiSearchResult(events=[], search_suggestions_html=None)

    monkeypatch.setattr(external_events, "fetch_gemini_events", gemini_result)
    settings = ExternalEventSettings(
        skiddle_api_key="",
        ticketmaster_api_key="",
        gemini_api_key="gemini-key",
        gemini_model="gemini-test",
        cache_seconds=60,
        request_timeout_seconds=2,
    )

    asyncio.run(discover_external_events(query="jazz", interests=[], settings=settings))
    asyncio.run(discover_external_events(query="jazz", interests=[], settings=settings))

    assert call_count == 2


def test_external_discovery_requires_authentication():
    response = client.get("/discover/external", params={"query": "jazz"})

    assert response.status_code == 401


def test_external_discovery_reports_unconfigured_providers(auth_headers, monkeypatch):
    for variable in ("SKIDDLE_API_KEY", "TICKETMASTER_API_KEY", "GEMINI_API_KEY"):
        monkeypatch.delenv(variable, raising=False)
    clear_external_event_cache()

    response = client.get(
        "/discover/external",
        params={"query": "jazz"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["events"] == []
    assert all(not provider["enabled"] for provider in response.json()["providers"])


def test_external_discovery_uses_profile_interests_without_a_query(
    auth_headers,
    monkeypatch,
):
    profile_response = client.patch(
        "/auth/me",
        headers=auth_headers,
        json={"interests": ["jazz", "pottery"]},
    )
    assert profile_response.status_code == 200
    mocked_discovery = AsyncMock(
        return_value=schemas.ExternalDiscoveryResponse(
            events=[external_event()],
            providers=[],
            terms=["jazz", "pottery"],
        )
    )
    monkeypatch.setattr(discovery, "discover_external_events", mocked_discovery)

    response = client.get("/discover/external", headers=auth_headers)

    assert response.status_code == 200
    mocked_discovery.assert_awaited_once_with(
        query="",
        interests=["jazz", "pottery"],
    )
