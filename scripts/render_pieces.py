"""Week 15 · renders the rule-desk assets from the same data the site uses (lib/content.ts via scripts/pieces-json.ts).

  node --experimental-strip-types --no-warnings scripts/pieces-json.ts > /tmp/pieces.json
  python3 scripts/render_pieces.py /tmp/pieces.json public/rules

Outputs: zara-card.png and five-days-card.png (1080 x 1350), two-jackets.mp4 (1080 x 1920, H.264, silent, captions on
screen) and two-jackets-poster.png. Needs Google Chrome (headless) and ffmpeg. Every card uses the playbook's five-block
layout: series tag (+ Fictional stamp) -> headline -> fact rows colored by status -> one next step -> source + date.
"""
import html
import json
import os
import subprocess
import sys
import tempfile

NAVY, INK, MUTE, LINE, PAPER = "#13294b", "#16202c", "#5b6675", "#e3e6ea", "#f7f8fa"
AMBER, RED, GREEN = "#b45309", "#b91c1c", "#047857"
TONE = {"ok": GREEN, "unknown": AMBER, "risk": RED, "plain": INK}
TAGS = {"store": "What the store says", "autopsy": "Cart autopsy", "five-days": "Your five days"}
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
FONT = "-apple-system, 'Segoe UI', Roboto, 'DejaVu Sans', Helvetica, Arial, sans-serif"


def nice(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{MONTHS[m - 1]} {d}, {y}"


def e(s):
    return html.escape(s, quote=False)


CSS = f"""
*{{box-sizing:border-box;margin:0}}
body{{width:W;height:H;font-family:{FONT};color:{INK};background:#fff;padding:80px 76px;display:flex;flex-direction:column}}
.top{{display:flex;justify-content:space-between;align-items:center}}
.tag{{color:{AMBER};font-weight:800;font-size:34px;letter-spacing:.08em;text-transform:uppercase}}
.brand{{color:{NAVY};font-weight:800;font-size:34px}}
.stamp{{display:inline-block;margin-left:18px;padding:6px 16px;border-radius:10px;background:{PAPER};color:{MUTE};font-size:28px;font-weight:700;letter-spacing:0;text-transform:none}}
h1{{color:{NAVY};font-weight:900;font-size:84px;line-height:1.04;letter-spacing:-.02em;margin-top:44px}}
.sub{{color:{MUTE};font-size:34px;margin-top:14px;line-height:1.3}}
.rows{{margin-top:44px}}
.row{{border-top:3px solid {LINE};padding:26px 0}}
.row:last-child{{border-bottom:3px solid {LINE}}}
.lab{{color:{MUTE};font-size:30px}}
.val{{font-size:44px;font-weight:800;line-height:1.18;margin-top:6px}}
.next{{margin-top:44px;border:5px solid {NAVY};border-radius:28px;padding:28px 34px;color:{NAVY};font-size:38px;font-weight:700;line-height:1.25}}
.grow{{flex:1}}
.foot{{color:{MUTE};font-size:28px;line-height:1.45}}
.foot b{{color:{NAVY}}}
.mid{{margin:auto 0}}
.mid h1{{margin-top:0}}
.big{{color:{RED};font-weight:900;font-size:190px;letter-spacing:-.04em;line-height:1;margin-top:60px}}
.quote{{font-size:62px;font-weight:800;color:{RED};line-height:1.2;margin-top:50px;border-left:12px solid {RED};padding-left:36px}}
.item{{display:flex;justify-content:space-between;border-top:3px solid {LINE};padding:30px 0;font-size:42px}}
.item s{{color:{MUTE};font-size:32px}}
.flag{{border-top:3px solid {LINE};padding:30px 0}}
.flag .t{{font-size:46px;font-weight:800;color:{INK}}}
.flag .d{{font-size:34px;color:{MUTE};margin-top:8px;line-height:1.3}}
"""


def page(w, h, body):
    return f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{CSS.replace('W', f'{w}px', 1).replace('H', f'{h}px', 1)}</style></head><body>{body}</body></html>"


def top(series, fictional=False):
    stamp = "<span class='stamp'>Fictional</span>" if fictional else ""
    return f"<div class='top'><span class='tag'>{e(TAGS[series])}{stamp}</span><span class='brand'>Before You Pay</span></div>"


def foot(p, grow=True):
    src = p["source"]
    return (
        ("<div class='grow'></div>" if grow else "") + f"<div class='foot'>Source: {e(src['label'])} · checked {nice(src['checkedAt'])}<br>"
        f"No store pays us · <b>beforeyoupay.xyz/rules</b></div>"
    )


def card(p, sub):
    rows = "".join(
        f"<div class='row'><div class='lab'>{e(f['label'])}</div><div class='val' style='color:{TONE[f['tone']]}'>{e(f['value'])}</div></div>"
        for f in p["facts"]
    )
    title = "It arrived too big?" if p["series"] == "five-days" else p["title"]
    return page(1080, 1350, f"{top(p['series'], p.get('fictional'))}<h1>{e(title)}</h1><div class='sub'>{e(sub)}</div>"
                f"<div class='rows'>{rows}</div><div class='next'>Next step: {e(p['nextStep'])}</div>")


def shoot(html_text, out_png, w, h, tmp):
    src = os.path.join(tmp, os.path.basename(out_png) + ".html")
    open(src, "w").write(html_text)
    subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    f"--window-size={w},{h}", f"--screenshot={out_png}", f"file://{src}"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def slide(p, inner):
    return f"{top('autopsy', True)}<div class='mid'>{inner}</div>{foot(p, grow=False)}"


def autopsy_slides(p, cart, result):
    ex = cart
    fl = result["flags"]
    s = []
    items = "".join(
        f"<div class='item'><span>{e(i['name'])} · {e(i['size'])}</span><span><s>MX${i['listPrice']:,}</s> MX${i['paidPrice']:,}</span></div>"
        for i in ex["items"])
    s.append(slide(p, f"<h1>{e(p['title'])}</h1><div class='sub'>A fictional cart, about to be paid.</div>"
             f"<div class='rows'>{items}<div class='item'><span>Code</span><span><b>{e(ex['discountCodes'][0])}</b></span></div>"
             f"<div class='item'><span><b>Total</b></span><span><b>MX${ex['total']:,}</b></span></div></div>"
             f"<div class='next'>On screen next to the pay button: “{e(ex['pressureCues'][0])}”</div>"))
    s.append(slide(p, f"<h1>Step 1 · Read the store’s own words</h1>"
             f"<div class='quote'>“Items bought with a promotional code are final sale.”</div>"
             f"<div class='sub' style='margin-top:40px'>The code is what pushes the purchase. It’s also what removes the return.</div>"))
    s.append(slide(p, f"<h1>Step 2 · Count what you can’t get back</h1>"
             f"<div class='big'>MX${result['moneyAtRisk']:,}</div><div class='sub' style='font-size:44px'>at risk if the size fails: both jackets.</div>"))
    flags = "".join(f"<div class='flag'><div class='t'>{e(f['title'])}</div><div class='d'>{e(f['detail'])}</div></div>" for f in fl[1:4])
    s.append(slide(p, f"<h1>Step 3 · Name what’s pushing you</h1><div class='rows'>{flags}</div>"))
    s.append(slide(p, f"<h1>Step 4 · One next step</h1><div class='next' style='font-size:52px;margin-top:70px'>{e(fl[0]['nextStep'])}</div>"
             f"<div class='sub' style='margin-top:40px'>Then decide: wait, change the size first, or buy anyway. Your call.</div>"))
    s.append(slide(p, f"<h1>Check your next cart before you pay.</h1>"
             f"<div class='sub' style='font-size:44px;margin-top:40px'>Upload the checkout screenshot. 1 full check a month is free.</div>"
             f"<div class='next' style='font-size:56px;text-align:center;margin-top:70px'>beforeyoupay.xyz/rules</div>"))
    return s


def main():
    data = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    pieces = {p["id"]: p for p in data["pieces"]}
    with tempfile.TemporaryDirectory() as tmp:
        shoot(card(pieces["zara"], "Return rule, in the store’s own words"), os.path.join(out, "zara-card.png"), 1080, 1350, tmp)
        shoot(card(pieces["five-days"], "What Mexican law gives you after delivery"), os.path.join(out, "five-days-card.png"), 1080, 1350, tmp)

        p = pieces["two-jackets"]
        slides = autopsy_slides(p, data["cart"], data["result"])
        pngs = []
        for i, body in enumerate(slides):
            png = os.path.join(tmp, f"s{i}.png")
            shoot(page(1080, 1920, body), png, 1080, 1920, tmp)
            pngs.append(png)
        subprocess.run(["cp", pngs[0], os.path.join(out, "two-jackets-poster.png")], check=True)
        dur, fade = [5.5, 5, 4.5, 6, 5.5, 4.5], 0.5
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for d, png in zip(dur, pngs):
            cmd += ["-loop", "1", "-t", str(d), "-i", png]
        chain, last, offset = [], "0:v", 0.0
        for i in range(1, len(pngs)):
            offset += dur[i - 1] - fade
            chain.append(f"[{last}][{i}:v]xfade=transition=fade:duration={fade}:offset={offset:.2f}[v{i}]")
            last = f"v{i}"
        chain.append(f"[{last}]format=yuv420p[out]")
        cmd += ["-filter_complex", ";".join(chain), "-map", "[out]", "-r", "30", "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "28", "-tune", "stillimage", "-movflags", "+faststart", os.path.join(out, "two-jackets.mp4")]
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
