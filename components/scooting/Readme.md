## Récupérer les rounds avec l'id d'un tournoi

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

## Récupérer une round avec l'id de la round
8472
https://api.ravensburgerplay.com/api/v2/tournament-rounds/7906/matches/paginated/?page=1&page_size=10&avoid_cache=true

payload:

```
{
    "page_size": 10,
    "count": 8,
    "total": 8,
    "current_page_number": 1,
    "next_page_number": null,
    "next": null,
    "previous": null,
    "previous_page_number": null,
    "results": [
        {
            "id": 36255,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 15976,
                        "pronouns": null,
                        "best_identifier": "Gaïane F",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                    },
                    "user_event_status": {
                        "id": 29001,
                        "best_identifier": "gaiflo",
                        "registration_status": "COMPLETE",
                        "matches_won": 2,
                        "matches_lost": 1,
                        "matches_drawn": 0,
                        "total_match_points": 6,
                        "user": {
                            "id": 15976,
                            "pronouns": null,
                            "best_identifier": "Gaïane F",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 26999,
                        "pronouns": null,
                        "best_identifier": "Lucas S",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                    },
                    "user_event_status": {
                        "id": 29013,
                        "best_identifier": "Racaille",
                        "registration_status": "COMPLETE",
                        "matches_won": 2,
                        "matches_lost": 1,
                        "matches_drawn": 0,
                        "total_match_points": 6,
                        "user": {
                            "id": 26999,
                            "pronouns": null,
                            "best_identifier": "Lucas S",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 1,
            "order": 0,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                15976,
                26999
            ]
        },
        {
            "id": 36256,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 13797,
                        "pronouns": null,
                        "best_identifier": "Christophe S",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmberSteel.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=9aea9616442c7a64340aedc4eeaa490e750e3798529c099fe107f0197d52e38b6b2364bfaf766a912590d1b44810aae37c67f6f23d1be121e0bba4d1ad23fdfccf7675f48a7dd0ea614e2dc6418d61de94fdc08262a62f7039ae421a94847f9f2bd8bb88a53fe473dd539ddc317fd2a327619153dfbc1606f4c4f299f1dcb85b68b4836be67ccc583b757906b1678213f8d8ff0c87207e1131ebcd508a78d3588c7e8b67a14a944cbd24e7c13fa3c845d14347f9a3ae4faa592a65435f69700706fd97c9036710c08a27ff7be2ca4c67e2f93e33ba07c4c89fa3067fb28bf34ea5db752ed119ffd322abc43be40a42dcc1c8022af00141a6f3037c5ba73f4952"
                    },
                    "user_event_status": {
                        "id": 29017,
                        "best_identifier": "IKL-Keristof",
                        "registration_status": "COMPLETE",
                        "matches_won": 2,
                        "matches_lost": 0,
                        "matches_drawn": 1,
                        "total_match_points": 7,
                        "user": {
                            "id": 13797,
                            "pronouns": null,
                            "best_identifier": "Christophe S",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmberSteel.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=9aea9616442c7a64340aedc4eeaa490e750e3798529c099fe107f0197d52e38b6b2364bfaf766a912590d1b44810aae37c67f6f23d1be121e0bba4d1ad23fdfccf7675f48a7dd0ea614e2dc6418d61de94fdc08262a62f7039ae421a94847f9f2bd8bb88a53fe473dd539ddc317fd2a327619153dfbc1606f4c4f299f1dcb85b68b4836be67ccc583b757906b1678213f8d8ff0c87207e1131ebcd508a78d3588c7e8b67a14a944cbd24e7c13fa3c845d14347f9a3ae4faa592a65435f69700706fd97c9036710c08a27ff7be2ca4c67e2f93e33ba07c4c89fa3067fb28bf34ea5db752ed119ffd322abc43be40a42dcc1c8022af00141a6f3037c5ba73f4952"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 25088,
                        "pronouns": null,
                        "best_identifier": "Yannis K",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                    },
                    "user_event_status": {
                        "id": 29004,
                        "best_identifier": "Yasuke",
                        "registration_status": "COMPLETE",
                        "matches_won": 2,
                        "matches_lost": 0,
                        "matches_drawn": 1,
                        "total_match_points": 7,
                        "user": {
                            "id": 25088,
                            "pronouns": null,
                            "best_identifier": "Yannis K",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 2,
            "order": 1,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                13797,
                25088
            ]
        },
        {
            "id": 36257,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 25083,
                        "pronouns": null,
                        "best_identifier": "Gauthier A",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                    },
                    "user_event_status": {
                        "id": 22662,
                        "best_identifier": "Gauth_6",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 0,
                        "matches_drawn": 2,
                        "total_match_points": 5,
                        "user": {
                            "id": 25083,
                            "pronouns": null,
                            "best_identifier": "Gauthier A",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200004Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=00debf8822c56456781cbdf20c572165eca140672077f7abdc3aa27fa4c2cf6f58dcf048dd2f2412cc81027229fa5b331ead9c03f92743d530de9921a9f1aca3af6516078cdca090455b3942f1d2dbda22ec4aa66f7c61810b46197a915177698c00375171718ffa1dce9a307da8d71a64cfd10593251c1c209b719996b7652cdab94346a0c0c56aba1b1c350f3e64b06f5edd223bb0b4cacc3dee477f45e08be8946886ee55502f03e13145634f83b79715383a1c2a88c2b05e4ece1d8a4be117b17cc1907247b243d20942cd787ba0fbd59c584d695588f8810b3edb8ab6011dece4cdc1f6637a59fd5a792ace2920e1940dcf266f859e7c3b497721d2e2fd"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 25084,
                        "pronouns": null,
                        "best_identifier": "Benjamin A",
                        "game_user_profile_picture_url": null
                    },
                    "user_event_status": {
                        "id": 28993,
                        "best_identifier": "Benjamin A",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 1,
                        "matches_drawn": 1,
                        "total_match_points": 4,
                        "user": {
                            "id": 25084,
                            "pronouns": null,
                            "best_identifier": "Benjamin A",
                            "game_user_profile_picture_url": null
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 3,
            "order": 2,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                25083,
                25084
            ]
        },
        {
            "id": 36258,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 25086,
                        "pronouns": null,
                        "best_identifier": "Lisa A",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d"
                    },
                    "user_event_status": {
                        "id": 22661,
                        "best_identifier": "[LCR] LaJefe",
                        "registration_status": "COMPLETE",
                        "matches_won": 2,
                        "matches_lost": 2,
                        "matches_drawn": 0,
                        "total_match_points": 6,
                        "user": {
                            "id": 25086,
                            "pronouns": null,
                            "best_identifier": "Lisa A",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 25094,
                        "pronouns": null,
                        "best_identifier": "Jeremy M",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmethystSapphire.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=220b9a67ed6e61b0086ab935c52e20c3c5ee4ab8f4b0c3b7cf3b39c7b22ae5852acd3d6f454253fdb1ca29574c26fad9fb95862d4a4ee2341a2a8f205029c95dd2644b21c55cc45b4c17df9ba80cadcc4cb1428e37ecd97712f11fb35400d965a32d0893643486b31aef9b920e53c13aa6fc6979c3001aa5ce74cf8568a598b14d4cb6d62ed17bc4654769b66573cc72f5f81762827ad4b52fa5205acac15e7c390a2a6e56ca5d7b26b8b59078f4a817994339e2fc33abf3d6ae4576e7a06b2108a7f646359f645d50e02f08114b4ff080405da276b59cc288fc6f3f92168ade1df30008649af950d7aae99e4f4ea3c1250e62c30c750db0aa35f6f6c1d92cf4"
                    },
                    "user_event_status": {
                        "id": 29008,
                        "best_identifier": "Asleval",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 3,
                        "matches_drawn": 0,
                        "total_match_points": 3,
                        "user": {
                            "id": 25094,
                            "pronouns": null,
                            "best_identifier": "Jeremy M",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmethystSapphire.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=220b9a67ed6e61b0086ab935c52e20c3c5ee4ab8f4b0c3b7cf3b39c7b22ae5852acd3d6f454253fdb1ca29574c26fad9fb95862d4a4ee2341a2a8f205029c95dd2644b21c55cc45b4c17df9ba80cadcc4cb1428e37ecd97712f11fb35400d965a32d0893643486b31aef9b920e53c13aa6fc6979c3001aa5ce74cf8568a598b14d4cb6d62ed17bc4654769b66573cc72f5f81762827ad4b52fa5205acac15e7c390a2a6e56ca5d7b26b8b59078f4a817994339e2fc33abf3d6ae4576e7a06b2108a7f646359f645d50e02f08114b4ff080405da276b59cc288fc6f3f92168ade1df30008649af950d7aae99e4f4ea3c1250e62c30c750db0aa35f6f6c1d92cf4"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:51:29+00:00",
            "table_number": 4,
            "order": 3,
            "status": "COMPLETE",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": 1,
            "games_won_by_winner": 1,
            "games_won_by_loser": 0,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": 25086,
            "assigned_judge": null,
            "players": [
                25086,
                25094
            ]
        },
        {
            "id": 36259,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 25096,
                        "pronouns": null,
                        "best_identifier": "Franck M",
                        "game_user_profile_picture_url": null
                    },
                    "user_event_status": {
                        "id": 29010,
                        "best_identifier": "Franck M",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 0,
                        "matches_drawn": 2,
                        "total_match_points": 5,
                        "user": {
                            "id": 25096,
                            "pronouns": null,
                            "best_identifier": "Franck M",
                            "game_user_profile_picture_url": null
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 31962,
                        "pronouns": null,
                        "best_identifier": "David F",
                        "game_user_profile_picture_url": null
                    },
                    "user_event_status": {
                        "id": 29000,
                        "best_identifier": "David F",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 0,
                        "matches_drawn": 2,
                        "total_match_points": 5,
                        "user": {
                            "id": 31962,
                            "pronouns": null,
                            "best_identifier": "David F",
                            "game_user_profile_picture_url": null
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 5,
            "order": 4,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                25096,
                31962
            ]
        },
        {
            "id": 36260,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 21699,
                        "pronouns": null,
                        "best_identifier": "Ciryl S",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                    },
                    "user_event_status": {
                        "id": 29015,
                        "best_identifier": "Cinou",
                        "registration_status": "COMPLETE",
                        "matches_won": 0,
                        "matches_lost": 0,
                        "matches_drawn": 3,
                        "total_match_points": 3,
                        "user": {
                            "id": 21699,
                            "pronouns": null,
                            "best_identifier": "Ciryl S",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 22733,
                        "pronouns": null,
                        "best_identifier": "Jean-Francois A",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d"
                    },
                    "user_event_status": {
                        "id": 22663,
                        "best_identifier": "[LCR] ElJefe",
                        "registration_status": "COMPLETE",
                        "matches_won": 0,
                        "matches_lost": 1,
                        "matches_drawn": 2,
                        "total_match_points": 2,
                        "user": {
                            "id": 22733,
                            "pronouns": null,
                            "best_identifier": "Jean-Francois A",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 6,
            "order": 5,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                21699,
                22733
            ]
        },
        {
            "id": 36261,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 25095,
                        "pronouns": null,
                        "best_identifier": "Julien M",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                    },
                    "user_event_status": {
                        "id": 29009,
                        "best_identifier": "[LCR] Gulien",
                        "registration_status": "COMPLETE",
                        "matches_won": 0,
                        "matches_lost": 0,
                        "matches_drawn": 3,
                        "total_match_points": 3,
                        "user": {
                            "id": 25095,
                            "pronouns": null,
                            "best_identifier": "Julien M",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 25090,
                        "pronouns": null,
                        "best_identifier": "Arthur L",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                    },
                    "user_event_status": {
                        "id": 29007,
                        "best_identifier": "ArthL",
                        "registration_status": "COMPLETE",
                        "matches_won": 1,
                        "matches_lost": 2,
                        "matches_drawn": 0,
                        "total_match_points": 3,
                        "user": {
                            "id": 25090,
                            "pronouns": null,
                            "best_identifier": "Arthur L",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 7,
            "order": 6,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                25095,
                25090
            ]
        },
        {
            "id": 36262,
            "player_match_relationships": [
                {
                    "player_order": 1,
                    "player": {
                        "id": 31959,
                        "pronouns": null,
                        "best_identifier": "Benjamin B",
                        "game_user_profile_picture_url": null
                    },
                    "user_event_status": {
                        "id": 28998,
                        "best_identifier": "Benjamin B",
                        "registration_status": "COMPLETE",
                        "matches_won": 0,
                        "matches_lost": 3,
                        "matches_drawn": 0,
                        "total_match_points": 0,
                        "user": {
                            "id": 31959,
                            "pronouns": null,
                            "best_identifier": "Benjamin B",
                            "game_user_profile_picture_url": null
                        }
                    }
                },
                {
                    "player_order": 2,
                    "player": {
                        "id": 25087,
                        "pronouns": null,
                        "best_identifier": "Jean-Yves K",
                        "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                    },
                    "user_event_status": {
                        "id": 29002,
                        "best_identifier": "Ludistorique",
                        "registration_status": "COMPLETE",
                        "matches_won": 0,
                        "matches_lost": 2,
                        "matches_drawn": 1,
                        "total_match_points": 1,
                        "user": {
                            "id": 25087,
                            "pronouns": null,
                            "best_identifier": "Jean-Yves K",
                            "game_user_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a"
                        }
                    }
                }
            ],
            "created_at": "2025-07-02T19:36:15+00:00",
            "updated_at": "2025-07-02T19:36:15+00:00",
            "table_number": 8,
            "order": 7,
            "status": "IN_PROGRESS",
            "pod_number": null,
            "match_is_intentional_draw": false,
            "match_is_unintentional_draw": false,
            "match_is_bye": false,
            "match_is_loss": false,
            "reports_are_in_conflict": false,
            "games_drawn": null,
            "games_won_by_winner": null,
            "games_won_by_loser": null,
            "is_ghost_match": false,
            "is_feature_match": false,
            "deck_check_started": false,
            "deck_check_completed": false,
            "time_extension_seconds": 0,
            "team_event_match": null,
            "tournament_round": 7906,
            "reporting_player": null,
            "winning_player": null,
            "assigned_judge": null,
            "players": [
                31959,
                25087
            ]
        }
    ]
}
```

## Récupérer le classement avec id round

https://api.ravensburgerplay.com/api/v2/tournament-rounds/7906/standings/paginated/?page=1&page_size=10&avoid_cache=true

{
    "page_size": 10,
    "count": 16,
    "total": 16,
    "current_page_number": 1,
    "next_page_number": 2,
    "next": 2,
    "previous": null,
    "previous_page_number": null,
    "results": [
        {
            "rank": 1,
            "player": {
                "id": 13797,
                "best_identifier": "Christophe S"
            },
            "user_event_status": {
                "id": 29017,
                "matches_won": 2,
                "matches_drawn": 1,
                "matches_lost": 0,
                "total_match_points": 7,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmberSteel.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=4132f1daeecbf6d9f0f40cb4270eb8a551b70bc61aac23704b63f8b2282553a1f50356eb68ccc6120ac6aa929e00b648cf5f6eccf0b4efe55630f7e97ce0d631c1b068264e6a3c764b7b0df6c47a5ccc27db67bf2f728e97c0b4da85f4fd496e9c7ac3514c0009fad492170000cfc033109f0bab8b372f2b4bb107498cbe379a78e1ec1f7445c2298189d93fe4e702f8168468b8e957c74a981be124abd700a85a1a5336e7edfda5e0f7da8bf35002fa546c0ee2dad20e5653da88b3330bd4e68e98d3eadeabd95d3ef34bd8f4361119e42cab27b8d288bdbde703984264502d612914af87da8488b2d5c8c515c2191f17f5a98f71206b8e2647dd45961363da",
                "registration_status": "COMPLETE",
                "best_identifier": "IKL-Keristof"
            },
            "record": "2-0-1",
            "match_record": "2-0-1",
            "match_points": 7,
            "opponent_match_win_percentage": 0.48037037,
            "opponent_game_win_percentage": 0.49095238
        },
        {
            "rank": 2,
            "player": {
                "id": 25088,
                "best_identifier": "Yannis K"
            },
            "user_event_status": {
                "id": 29004,
                "matches_won": 2,
                "matches_drawn": 1,
                "matches_lost": 0,
                "total_match_points": 7,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Yasuke"
            },
            "record": "2-0-1",
            "match_record": "2-0-1",
            "match_points": 7,
            "opponent_match_win_percentage": 0.36925926,
            "opponent_game_win_percentage": 0.41687831
        },
        {
            "rank": 3,
            "player": {
                "id": 15976,
                "best_identifier": "Gaïane F"
            },
            "user_event_status": {
                "id": 29001,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 1,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "gaiflo"
            },
            "record": "2-1-0",
            "match_record": "2-1-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.53703704,
            "opponent_game_win_percentage": 0.47619047
        },
        {
            "rank": 4,
            "player": {
                "id": 25086,
                "best_identifier": "Lisa A"
            },
            "user_event_status": {
                "id": 22661,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 2,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d",
                "registration_status": "COMPLETE",
                "best_identifier": "[LCR] LaJefe"
            },
            "record": "2-2-0",
            "match_record": "2-2-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.47055556,
            "opponent_game_win_percentage": 0.4775
        },
        {
            "rank": 5,
            "player": {
                "id": 26999,
                "best_identifier": "Lucas S"
            },
            "user_event_status": {
                "id": 29013,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 1,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Racaille"
            },
            "record": "2-1-0",
            "match_record": "2-1-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.36925926,
            "opponent_game_win_percentage": 0.37984127
        },
        {
            "rank": 6,
            "player": {
                "id": 25083,
                "best_identifier": "Gauthier A"
            },
            "user_event_status": {
                "id": 22662,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Gauth_6"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.4062963,
            "opponent_game_win_percentage": 0.47023809
        },
        {
            "rank": 7,
            "player": {
                "id": 25096,
                "best_identifier": "Franck M"
            },
            "user_event_status": {
                "id": 29010,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "Franck M"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.40518519,
            "opponent_game_win_percentage": 0.42746032
        },
        {
            "rank": 8,
            "player": {
                "id": 31962,
                "best_identifier": "David F"
            },
            "user_event_status": {
                "id": 29000,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "David F"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.38777778,
            "opponent_game_win_percentage": 0.36925926
        },
        {
            "rank": 9,
            "player": {
                "id": 25084,
                "best_identifier": "Benjamin A"
            },
            "user_event_status": {
                "id": 28993,
                "matches_won": 1,
                "matches_drawn": 1,
                "matches_lost": 1,
                "total_match_points": 4,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "Benjamin A"
            },
            "record": "1-1-1",
            "match_record": "1-1-1",
            "match_points": 4,
            "opponent_match_win_percentage": 0.74074074,
            "opponent_game_win_percentage": 0.73015873
        },
        {
            "rank": 10,
            "player": {
                "id": 25094,
                "best_identifier": "Jeremy M"
            },
            "user_event_status": {
                "id": 29008,
                "matches_won": 1,
                "matches_drawn": 0,
                "matches_lost": 3,
                "total_match_points": 3,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmethystSapphire.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=220b9a67ed6e61b0086ab935c52e20c3c5ee4ab8f4b0c3b7cf3b39c7b22ae5852acd3d6f454253fdb1ca29574c26fad9fb95862d4a4ee2341a2a8f205029c95dd2644b21c55cc45b4c17df9ba80cadcc4cb1428e37ecd97712f11fb35400d965a32d0893643486b31aef9b920e53c13aa6fc6979c3001aa5ce74cf8568a598b14d4cb6d62ed17bc4654769b66573cc72f5f81762827ad4b52fa5205acac15e7c390a2a6e56ca5d7b26b8b59078f4a817994339e2fc33abf3d6ae4576e7a06b2108a7f646359f645d50e02f08114b4ff080405da276b59cc288fc6f3f92168ade1df30008649af950d7aae99e4f4ea3c1250e62c30c750db0aa35f6f6c1d92cf4",
                "registration_status": "COMPLETE",
                "best_identifier": "Asleval"
            },
            "record": "1-3-0",
            "match_record": "1-3-0",
            "match_points": 3,
            "opponent_match_win_percentage": 0.56861111,
            "opponent_game_win_percentage": 0.52297619
        }
    ]
}

## Récupérer les profils user d'un tournoi

https://api.ravensburgerplay.com/api/v2/events/159805/registrations/?page=1&page_size=10

payload:

{
    "page_size": 10,
    "count": 16,
    "total": 16,
    "current_page_number": 1,
    "next_page_number": 2,
    "next": 2,
    "previous": null,
    "previous_page_number": null,
    "results": [
        {
            "rank": 1,
            "player": {
                "id": 13797,
                "best_identifier": "Christophe S"
            },
            "user_event_status": {
                "id": 29017,
                "matches_won": 2,
                "matches_drawn": 1,
                "matches_lost": 0,
                "total_match_points": 7,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmberSteel.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=4132f1daeecbf6d9f0f40cb4270eb8a551b70bc61aac23704b63f8b2282553a1f50356eb68ccc6120ac6aa929e00b648cf5f6eccf0b4efe55630f7e97ce0d631c1b068264e6a3c764b7b0df6c47a5ccc27db67bf2f728e97c0b4da85f4fd496e9c7ac3514c0009fad492170000cfc033109f0bab8b372f2b4bb107498cbe379a78e1ec1f7445c2298189d93fe4e702f8168468b8e957c74a981be124abd700a85a1a5336e7edfda5e0f7da8bf35002fa546c0ee2dad20e5653da88b3330bd4e68e98d3eadeabd95d3ef34bd8f4361119e42cab27b8d288bdbde703984264502d612914af87da8488b2d5c8c515c2191f17f5a98f71206b8e2647dd45961363da",
                "registration_status": "COMPLETE",
                "best_identifier": "IKL-Keristof"
            },
            "record": "2-0-1",
            "match_record": "2-0-1",
            "match_points": 7,
            "opponent_match_win_percentage": 0.48037037,
            "opponent_game_win_percentage": 0.49095238
        },
        {
            "rank": 2,
            "player": {
                "id": 25088,
                "best_identifier": "Yannis K"
            },
            "user_event_status": {
                "id": 29004,
                "matches_won": 2,
                "matches_drawn": 1,
                "matches_lost": 0,
                "total_match_points": 7,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Yasuke"
            },
            "record": "2-0-1",
            "match_record": "2-0-1",
            "match_points": 7,
            "opponent_match_win_percentage": 0.36925926,
            "opponent_game_win_percentage": 0.41687831
        },
        {
            "rank": 3,
            "player": {
                "id": 15976,
                "best_identifier": "Gaïane F"
            },
            "user_event_status": {
                "id": 29001,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 1,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "gaiflo"
            },
            "record": "2-1-0",
            "match_record": "2-1-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.53703704,
            "opponent_game_win_percentage": 0.47619047
        },
        {
            "rank": 4,
            "player": {
                "id": 25086,
                "best_identifier": "Lisa A"
            },
            "user_event_status": {
                "id": 22661,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 2,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/Amber.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=538c44d1457f87593774e35004eefcb4d844ac3cf2bcc554dc9f05bd3bccc8cd4967d4eeea8e590566939dbbda4b2c8d5b3a9d654575f58635b8a618b082638f3ae5df6b6a81c3fc0d495a9b1b28d19469848ef7b1b97f54a0011afcbfdd352e445c244b3db9e673290c175dbbc36e77ebc45291c3bb9dc9b390d777b25fcef8aea65ead833992850249363bb6b974bd159cfee49d207a4fe3dfd6360f5614c94fc2303dcf321828d97ee55b5c07dfd58b1b51063951b4dd6d613eec1e4474d11614a41bc9214b922d307da784ee9ec667665d4c2a317b9bdaa759d54b1ea42040660c0bc502ea9dcaaf5065cb1b312689b1b07d4e847296bf614ac52b183b9d",
                "registration_status": "COMPLETE",
                "best_identifier": "[LCR] LaJefe"
            },
            "record": "2-2-0",
            "match_record": "2-2-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.47055556,
            "opponent_game_win_percentage": 0.4775
        },
        {
            "rank": 5,
            "player": {
                "id": 26999,
                "best_identifier": "Lucas S"
            },
            "user_event_status": {
                "id": 29013,
                "matches_won": 2,
                "matches_drawn": 0,
                "matches_lost": 1,
                "total_match_points": 6,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Racaille"
            },
            "record": "2-1-0",
            "match_record": "2-1-0",
            "match_points": 6,
            "opponent_match_win_percentage": 0.36925926,
            "opponent_game_win_percentage": 0.37984127
        },
        {
            "rank": 6,
            "player": {
                "id": 25083,
                "best_identifier": "Gauthier A"
            },
            "user_event_status": {
                "id": 22662,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/1-IlluminaryGoldIconRoyalPurple.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=08a738c72cbf355a8fe58b5aa86a51443c6eb33cdc1e2f9ef8d4ad2a1afccd4746ebffe721226f451e3cad192da3175c2b7fa31e7f8b6b41f317fada41e6b81236fb6be1d2d7df9d3610ff471f8246ac8bed960bb7c706ef76e5fb403fae3f054f136e21f41641da0da9952622d0c4271c607f8ff4f85314603b04aabe0395fb9f39b598d3cda5f1e01ea84f3ff2b15ab7bc090a1b0d16f2b728afce70fc782b7af55928368aa775a08a885d7fb150aa55091dc896bf394d12ab495fb7293c4a803eec863cb3addf8e59fde4c71150ef90607d5e87ffd9b93e3588a5c4c3b4fb62d0a1f420e414e30319cb98ada383af4ce60a61cc54153c6cf352a3ee15248a",
                "registration_status": "COMPLETE",
                "best_identifier": "Gauth_6"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.4062963,
            "opponent_game_win_percentage": 0.47023809
        },
        {
            "rank": 7,
            "player": {
                "id": 25096,
                "best_identifier": "Franck M"
            },
            "user_event_status": {
                "id": 29010,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "Franck M"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.40518519,
            "opponent_game_win_percentage": 0.42746032
        },
        {
            "rank": 8,
            "player": {
                "id": 31962,
                "best_identifier": "David F"
            },
            "user_event_status": {
                "id": 29000,
                "matches_won": 1,
                "matches_drawn": 2,
                "matches_lost": 0,
                "total_match_points": 5,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "David F"
            },
            "record": "1-0-2",
            "match_record": "1-0-2",
            "match_points": 5,
            "opponent_match_win_percentage": 0.38777778,
            "opponent_game_win_percentage": 0.36925926
        },
        {
            "rank": 9,
            "player": {
                "id": 25084,
                "best_identifier": "Benjamin A"
            },
            "user_event_status": {
                "id": 28993,
                "matches_won": 1,
                "matches_drawn": 1,
                "matches_lost": 1,
                "total_match_points": 4,
                "full_profile_picture_url": null,
                "registration_status": "COMPLETE",
                "best_identifier": "Benjamin A"
            },
            "record": "1-1-1",
            "match_record": "1-1-1",
            "match_points": 4,
            "opponent_match_win_percentage": 0.74074074,
            "opponent_game_win_percentage": 0.73015873
        },
        {
            "rank": 10,
            "player": {
                "id": 25094,
                "best_identifier": "Jeremy M"
            },
            "user_event_status": {
                "id": 29008,
                "matches_won": 1,
                "matches_drawn": 0,
                "matches_lost": 3,
                "total_match_points": 3,
                "full_profile_picture_url": "https://storage.googleapis.com/spicerack_media/game_images/1_disney-lorcana/profile/AmethystSapphire.webp?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=storages-service-account%40counterbalance-381319.iam.gserviceaccount.com%2F20250702%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250702T200005Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=220b9a67ed6e61b0086ab935c52e20c3c5ee4ab8f4b0c3b7cf3b39c7b22ae5852acd3d6f454253fdb1ca29574c26fad9fb95862d4a4ee2341a2a8f205029c95dd2644b21c55cc45b4c17df9ba80cadcc4cb1428e37ecd97712f11fb35400d965a32d0893643486b31aef9b920e53c13aa6fc6979c3001aa5ce74cf8568a598b14d4cb6d62ed17bc4654769b66573cc72f5f81762827ad4b52fa5205acac15e7c390a2a6e56ca5d7b26b8b59078f4a817994339e2fc33abf3d6ae4576e7a06b2108a7f646359f645d50e02f08114b4ff080405da276b59cc288fc6f3f92168ade1df30008649af950d7aae99e4f4ea3c1250e62c30c750db0aa35f6f6c1d92cf4",
                "registration_status": "COMPLETE",
                "best_identifier": "Asleval"
            },
            "record": "1-3-0",
            "match_record": "1-3-0",
            "match_points": 3,
            "opponent_match_win_percentage": 0.56861111,
            "opponent_game_win_percentage": 0.52297619
        }
    ]
}