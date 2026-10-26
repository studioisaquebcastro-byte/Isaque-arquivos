# Estilo 21 em Remotion: kit + demo "Traço fino"

Recriação da técnica descrita em `../estilo-21-linha-guia-continua.md`. O vídeo é um único plano de 15 s, sem cortes, em que a linha néon (a agulha) liga todas as cenas.

## Correr

```bash
npm install
npm run studio                       # pré-visualizar
CHROME_PATH=/caminho/chrome-headless-shell npm run render   # → out/traco-fino.mp4
```

`CHROME_PATH` é opcional: sem ele, o Remotion descarrega o próprio browser.

## Peças do kit (`src/kit.tsx`)

| Peça | O que faz |
|---|---|
| `cameraAt(f, CAM)` | Câmara virtual por keyframes (x, y, escala, rotX, rotY) com ease in-out e zoom em escala logarítmica. O mundo é um `div` de 4000×4000 e a câmara move-o. |
| `GuideSeg` | Segmento da linha-guia: traço com glow, desenhado por `strokeDashoffset`, com cabeça brilhante e fade de saída. |
| `NeedleHead` | Ponto brilhante da cabeça da linha (a "agulha"). |
| `Odometer` | Contador em slots com rolo vertical e spring. |
| `GlassCard` | Cartão de vidro com borda de cor e entrada em spring. |
| `Reveal` | Revela texto por máscara, da esquerda ou a partir do centro, sincronizado com a linha. |

O motion blur vem de `CameraMotionBlur` (6 amostras) à volta de toda a cena.

## Guião da demo (`src/TracoFino.tsx`)

| Tempo | Cena |
|---|---|
| 0,0–1,0 s | Partículas convergem num ponto (a agulha) |
| 1,0–3,0 s | A linha escreve "TATUAGEM DE TRAÇO FINO" e "quase sempre precisa de retoque" |
| 3,0–5,5 s | A linha mergulha num cartão de pele e desenha a tatuagem fina (com zumbido da máquina) |
| 5,5–8,0 s | Contador de 1 a 30 dias de cicatrização: o traço desbota, abre falhas, a lupa amplia e aparecem as etiquetas FALHA |
| 8,0–11,0 s | Carrossel 3D com os porquês: agulha fina, menos tinta, cicatrização |
| 11,0–12,8 s | As 3 linhas convergem e abrem "O RETOQUE. Faz parte do processo." |
| 12,8–15,0 s | A câmara volta à pele, a agulha repassa o traço, as falhas fecham (✓) e aparece "✓ TRAÇO COMPLETO" |

Os SFX (`public/sfx`) foram sintetizados com ffmpeg: whoosh, tick, ping, pop, impacto, ding, zumbido da máquina e uma cama grave.
