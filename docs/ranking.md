## Récupérer le classement avec id round

https://api.ravensburgerplay.com/api/v2/tournament-rounds/7906/standings/paginated/?page=1&page_size=10&avoid_cache=true

```
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
```