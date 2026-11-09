<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$beats = [
    [
        "id" => 1,
        "title" => "Plot Twist",      
        "bpm" => "135",
        "key" => "C# Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/Plot_twist_alobeats_alolasxtahtx.mp3"
    ],
    [
        "id" => 2,
        "title" => "Mermaid",
        "bpm" => "151",
        "key" => "B Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/mermaid_alobeats_alolasxchrismarek.mp3"
    ],
    [
        "id" => 3,
        "title" => "Suffer",
        "bpm" => "184",
        "key" => "C Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/suffer_alobeats_alolasxjkei.mp3"
    ],
    [
        "id" => 4,
        "title" => "Flowers",
        "bpm" => "164",
        "key" => "Dbm",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/flowers_alobeats_alolasxjkei.mp3"
    ],
    [
        "id" => 5,
        "title" =>"Bloodmoon",
        "bpm" => "140",
        "key" => "F# Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/bloodmoon_alolasxjkei.mp3"
    ],
    [
        "id" => 6,
        "title" => "Ice cupid",
        "bpm" => "144",
        "key" => "F# Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/icecupid_alobeats_alolas.mp3"
    ],
    [
        "id" => 7,
        "title" => "Cute dreams",
        "bpm" => "136",
        "key" => "G# Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/cutedreams_alobeats_alolas.mp3"
    ],
    [
        "id" => 8,
        "title" => "Crisis Actor",
        "bpm" => "162",
        "key" => "B Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/crisisactor_alobeats_alolasxjkei.mp3"
    ],
    [
        "id" => 9,
        "title" => "Freak",
        "bpm" => "158",
        "key" => "F Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/freak_alobeats_alolasxjkei.mp3"
    ],
    [
        "id" => 10,
        "title" => "Chocolate Bar",
        "bpm" => "168",
        "key" => "D# Minor",
        "cover" => "cover.gif",
        "audio" => "Audio_Beats/chocolatebar_alobeats_alolasxjkei.mp3"
    ]
];

echo json_encode($beats);
?>
