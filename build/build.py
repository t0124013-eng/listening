import pathlib,re
B=pathlib.Path(__file__).parent; R=B.parent
css=(B/'base.css').read_text()+'\n'+(B/'app.css').read_text()
js=(B/'app.js').read_text()
html=(B/'app.html').read_text()
head='''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>リスニング ラボ</title>
<meta name="description" content="大学入試レベルの英語リスニングを1セット10分で。続けるほど学びの木が育ちます。">
<meta name="theme-color" content="#E9EDF2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141B24" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="リスニング ラボ">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
'''
out=head+css+'\n</style>\n</head>\n<body>\n'+html+'\n<script src="sets.js"></script>\n<script>\n'+js+'\n</script>\n</body>\n</html>\n'
(R/'index.html').write_text(out)
# Artifact preview (no doctype/head; same files)
prev='<title>リスニング ラボ</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=IBM+Plex+Mono:wght@500&display=swap">\n<style>\n'+css+'\n</style>\n'+html+'\n<script src="sets.js"></script>\n<script>\n'+js+'\n</script>\n'
(B/'preview.html').write_text(prev)
print(len(out))
