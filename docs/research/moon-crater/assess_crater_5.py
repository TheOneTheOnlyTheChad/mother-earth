"""Moon item 5 (CRaTER), rev 2: what else moves in the 10 June 12:40-13:10 UTC bins (GOOD about 32/s vs about 29.8/s).
Per 10-minute UTC-timestamp group: GOOD, REJECT, singles S1-S6, altitude above 1737.4 km and latitude (MOONVEC). Descriptive only."""
import sys, math
raw = open(sys.argv[1] + '/CRAT_L2_SEC_2026161_V01.TAB', 'rb').read()
rr = [raw[i:i + 194][:-2].decode().split(',') for i in range(0, len(raw), 194)]
def mean(col, a): return sum(float(r[col]) for r in rr[a]) / 600
print('day means: GOOD %.3f REJECT %.3f S1 %.2f S2 %.2f S3 %.2f S4 %.2f S5 %.2f S6 %.2f' % tuple(
    sum(float(r[c]) for r in rr) / len(rr) for c in (26, 27, 20, 21, 22, 23, 24, 25)))
for k in range(66, 86):  # 11:00 .. 14:10
    a = slice(600 * k, 600 * k + 600)
    alt = [math.sqrt(sum(float(r[c]) ** 2 for c in (29, 30, 31))) - 1737.4 for r in rr[a]]
    lat = [math.degrees(math.asin(float(r[31]) / math.sqrt(sum(float(r[c]) ** 2 for c in (29, 30, 31))))) for r in rr[a]]
    print('%02d:%02d GOOD %.3f REJ %.3f S1 %.2f S2 %.2f S3 %.2f S4 %.2f S5 %.2f S6 %.2f | alt %.1f-%.1f km lat %.1f..%.1f' % (
        k // 6, 10 * (k % 6), mean(26, a), mean(27, a), *[mean(c, a) for c in range(20, 26)], min(alt), max(alt), lat[0], lat[-1]))
