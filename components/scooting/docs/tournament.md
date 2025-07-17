## Récupérer les infos du tournoi

https://api.ravensburgerplay.com/api/v2/events/159805/

dans `tournament_phases`
payload:

```
{
    "id": 159805,
    "full_header_image_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/banner/disney_lorcana_banner_3.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=c6563fb3b20edc32ef7272c6c95232d0159c647ae5ef861460ed89c604839c19936e1e876089a905f5cd96b610d7720ee454f24c569c0c8540bb8690cd1461462deaf692a6d154f6d18eda17231edbe692e36f4f3a1e85c86418897a959817e762ce91d02d2d272c820f19472aecda07c19a9b12268f99ca4b9675a7f07be51afc9b982a3fb9695c9f26a0050f82745d96130a8b872444966372ef088166ae10ecea00d61193ab2818e6be7531ab3db3e7e6239fd656ef6d15b227516cf7d1cfc06249100260eff137f45ac45f8b14feba46b626286d5a07b53916f32e5a1ef22e91f5d8b758c601bebeea66f886b030d7e0e098830d18070a217fae61bebca7",
    "start_datetime": "2025-07-02T17:00:00+00:00",
    "end_datetime": null,
    "day_2_start_datetime": null,
    "timer_end_datetime": "2025-07-02T20:26:10+00:00",
    "timer_paused_at_datetime": "2025-07-02T19:36:10+00:00",
    "timer_is_running": false,
    "description": "Séance de ligue LORCANA\n🃏 Format : Tournoi Construit\n• 💸PAF : 6 €\n• ⏱ Durée : 3 ou 4 rondes suisses de 40min en bo2\n• 🎁 Lots : pour 3 rondes : 3.5€ de bon d'achat par victoire, 1,75€ par match nul                                                                                                                     \n                    pour 4 rondes : 2,5€ de bon d'achat par victoire, 1.25€ par match nul\n1 booster distribué aléatoirement parmi les joueurs ! \nVous gagnerez également des points pour la ligue et des récompenses LORCANA",
    "settings": {
        "id": 6685,
        "decklist_status": "SUBMISSIONS_OPEN",
        "event_lifecycle_status": "EVENT_IN_PROGRESS",
        "show_registration_button": true,
        "round_duration_in_minutes": 50,
        "payment_in_store": false,
        "payment_on_spicerack": false,
        "maximum_number_of_game_wins_per_match": 2,
        "maximum_number_of_draws_per_match": null,
        "checkin_methods": [],
        "stripe_price_id": null
    },
    "tournament_phases": [
        {
            "id": 7522,
            "first_round_type": null,
            "status": "IN_PROGRESS",
            "order_in_phases": 1,
            "number_of_rounds": 4,
            "round_type": "SWISS",
            "rank_required_to_enter_phase": null,
            "rounds": [
                {
                    "id": 7903,
                    "round_number": 1,
                    "final_round_in_event": false,
                    "pairings_status": "GENERATED",
                    "standings_status": "GENERATED",
                    "round_type": "PLAY_VS_OPPONENT",
                    "status": "COMPLETE"
                },
                {
                    "id": 7904,
                    "round_number": 2,
                    "final_round_in_event": false,
                    "pairings_status": "GENERATED",
                    "standings_status": "GENERATED",
                    "round_type": "PLAY_VS_OPPONENT",
                    "status": "COMPLETE"
                },
                {
                    "id": 7905,
                    "round_number": 3,
                    "final_round_in_event": false,
                    "pairings_status": "GENERATED",
                    "standings_status": "GENERATED",
                    "round_type": "PLAY_VS_OPPONENT",
                    "status": "COMPLETE"
                },
                {
                    "id": 7906,
                    "round_number": 4,
                    "final_round_in_event": false,
                    "pairings_status": "GENERATED",
                    "standings_status": "NOT_GENERATED",
                    "round_type": "PLAY_VS_OPPONENT",
                    "status": "IN_PROGRESS"
                }
            ]
        }
    ],
    "registered_user_count": 16,
    "full_address": "59 Rue de Rivoli, Paris, IDF, 75001, FR",
    "store": {
        "id": 3886,
        "name": "Playin Paris Rivoli",
        "full_address": "59 Rue de Rivoli, Paris, IDF, 75001, FR",
        "administrative_area_level_1_short": "IDF",
        "country": "FR",
        "website": "https://www.play-in.com/evenement/boutique-paris-rivoli",
        "latitude": 48.8592323,
        "longitude": 2.345664
    },
    "convention": null,
    "gameplay_format": {
        "id": "2b6e184a-72d7-4ae5-a5f1-f16d79646c39",
        "name": "Core Constructed",
        "description": "Constructed format using cards from the most recent sets"
    },
    "distance_in_miles": null,
    "name": "Lorcana 02/07",
    "pinned_by_store": false,
    "use_verbatim_name": false,
    "queue_status": "ACCEPTING_SIGNUPS",
    "game_type": "LORCANA",
    "source": null,
    "event_status": "SCHEDULED",
    "event_format": "OTHER",
    "event_type": "LOCALS",
    "pairing_system": null,
    "rules_enforcement_level": "CASUAL",
    "coordinates": {
        "type": "Point",
        "coordinates": [
            2.345664,
            48.8592323
        ]
    },
    "timezone": null,
    "event_address_override": null,
    "event_is_online": false,
    "latitude": 48.8592323,
    "longitude": 2.345664,
    "cost_in_cents": 0,
    "currency": "USD",
    "capacity": 24,
    "url": null,
    "number_of_rc_invites": null,
    "top_cut_size": null,
    "number_of_rounds": null,
    "number_of_days": 1,
    "is_headlining_event": false,
    "is_on_demand": false,
    "prevent_sync": false,
    "header_image": null,
    "starting_table_number": 1,
    "ending_table_number": null,
    "admin_list_display_order": 0,
    "prizes_awarded": false,
    "is_test_event": false,
    "is_template": false,
    "tax_enabled": true,
    "polymorphic_ctype": 121,
    "game": 1,
    "product_list": null,
    "event_factory_created_by": null,
    "event_configuration_template": "810d4ea0-3ea8-4c67-9381-4c4840330cf8",
    "banner_image": 4,
    "phase_template_group": "d3289156-dc49-4c89-ba2e-f5f06c2e59f0"
}
```