# Validation measures on real frames

Decoded picture (2,048 px) against decoded check image (256 px). "bg" = share of surround samples within 28 of the requested colour; "worst" = largest difference in the surround; "spread" = standard deviation of block brightness inside the disk; "agree" = correlation of block brightness between the two.

| Picture | Check image | bg | worst | spread | agree |
|---|---|---|---|---|---|
| day 11:00 | day 11:00 | 1.000 | 1.9 | 47.6 | **0.936** |
| night 00:00 | night 00:00 | 1.000 | 1.9 | 36.1 | **0.937** |
| dusk 16:50 | dusk 16:50 | 1.000 | 3.6 | 52.7 | **0.943** |
| day | night | 1.000 | 1.9 | 47.6 | 0.417 |
| day | dusk | 1.000 | 1.9 | 47.6 | 0.413 |
| night | day | 1.000 | 1.9 | 36.1 | 0.416 |
| night | dusk | 1.000 | 1.9 | 36.1 | 0.314 |
| dusk | day | 1.000 | 3.6 | 52.7 | 0.419 |
| dusk | night | 1.000 | 3.6 | 52.7 | 0.315 |

Limits set from this (provisional; three frames from one day): surround colour within 16 on at least 98% of samples; spread at least 12; agreement at least 0.85. Matched pairs sit at 0.936 to 0.943; pictures of other frames at 0.31 to 0.42. **Not yet seen:** frames from other seasons, eclipse periods, a full-night Atlantic frame with little cloud, or a frame the service itself rendered with missing segments. More frames are needed before the limits are treated as settled.
