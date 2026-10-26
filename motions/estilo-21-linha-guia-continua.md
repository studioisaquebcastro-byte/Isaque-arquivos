# Estilo 21: "Linha-guia contínua" (plano-sequência de motion num monitor)

Engenharia reversa de um reel de referência de 23,7 s, 9:16, 30 fps: uma animação de marca, toda em verde-néon sobre fundo escuro, mostrada num monitor filmado numa secretária. O que importa aqui é a **técnica**, não a marca nem o assunto.

## 1. Porque parece "complexo"

O vídeo **não tem um único corte** (a deteção de cena com limiar 0,25 não encontrou nenhum). São 19 s de animação em que **cada cena nasce da anterior**. A complexidade vem de 5 regras aplicadas juntas:

1. **Fio condutor físico.** Uma linha verde brilhante (traço com glow e uma "cabeça" redonda) entra em todas as cenas. Desenha o sublinhado do logo, puxa os ícones, contorna o card, vira forma de onda de áudio, liga os cards, converge num ponto e vira o sublinhado do título. O olho segue sempre a linha, por isso nunca se perde.
2. **Match-cut por forma.** A transição acontece sempre através de um objeto que muda de função: a linha vira sublinhado, a barra de progresso vira serpentina que gira numa órbita à volta da chama, a chama dá lugar a um contador, o contador vira a linha de dias da semana, a lista de ranking é envolvida por um anel que encolhe e vira a linha seguinte.
3. **Câmara 3D virtual sempre em movimento.** Há sempre um push-in, uma inclinação (tilt em perspetiva sobre os cards) ou um pan lateral num carrossel. Nada fica parado mais de ~0,6 s, exceto o logo final (hold de ~2 s).
4. **Motion blur e profundidade de campo.** Os elementos que entram ou saem vão desfocados e com rasto (bem visível em 3,4–4,4 s nas palavras e em 13,8 s no carrossel). É isto que dá o ar de "render 3D caro".
5. **Ritmo de 0,4 a 0,8 s por micro-cena**, com um SFX curto (whoosh, click, pop) em cada transição e um impacto mais forte no fim (pico de áudio aos 20,0 s).

## 2. Mapa temporal (beat a beat)

| Tempo | Cena | Técnica de motion | Como passa para a seguinte |
|---|---|---|---|
| 0,0–0,4 | Explosão de partículas (hyperspace) | Linhas radiais a partir do centro, a acelerar para fora | O flash revela a mascote |
| 0,4–1,0 | Mascote 3D aparece | Scale com overshoot, fragmentos a voar (shatter inverso), glow forte que assenta | — |
| 1,0–1,6 | Logo | A linha atravessa da esquerda para a direita; o texto faz reveal letra a letra atrás da cabeça da linha | Câmara faz pan, a linha continua e dobra para baixo |
| 1,8–2,6 | Trilho de lições (bolinhas com estrelas) | Câmara desce ao longo do path em diagonal, com DOF | Zoom para dentro de um nó que se transforma em card |
| 2,8–4,6 | Exercício de tradução (UI) | O card abre em perspetiva; as palavras (chips) caem uma a uma com motion blur e o botão "Comprobar" fica verde | Zoom-out mostra o ecrã completo |
| 4,8–5,2 | Barra de progresso | A barra enche, sai do card e vira uma fita 3D | A fita enrola-se em espiral (serpentina) |
| 5,2–5,4 | Espiral | Morph da fita para órbita circular | O anel da órbita "acende" a chama |
| 5,4–7,0 | Contador (streak) | Odómetro em slots: 1, 7, 30, 100, 200, 365 com ease-out e roll vertical; aparece o rótulo "DÍAS" e a fila de dias da semana com checks em stagger | A chama sozinha faz zoom (hold de 0,2 s) |
| 7,4–9,0 | Ranking/liga | Os itens da semana viram uma coluna; a linha verde sobe; a linha "TÚ" fica realçada e sobe posições (reorder animado) | Um anel verde envolve a lista e encolhe |
| 9,2–10,0 | A linha volta a ser protagonista | O traço desenha um retângulo arredondado (stroke-dashoffset) | O retângulo vira a moldura do card de videochamada |
| 10,0–11,6 | Card de chamada | A moldura enche-se, a mascote anima e a linha à direita vira forma de onda de áudio a reagir | A onda "desliga-se" e fica uma linha reta |
| 11,8–14,4 | Carrossel de skills (idiomas, matemática, música, xadrez) | Cards de vidro com bordas de cor diferente, pan lateral em 3D com parallax, ícones 3D em cada um; uma linha verde cai do topo para cada card | Zoom-out: os 4 cards em fila, cada um ligado por uma linha |
| 14,6–15,2 | Convergência | As 4 linhas descem e convergem num ponto (visual de "tudo leva a um caminho") | O ponto abre-se numa linha horizontal |
| 15,4–16,8 | Tipografia | "UN SOLO CAMINO." com typewriter e reveal por máscara, depois o subtítulo; o sublinhado ganha um gradiente multicor (as cores dos cards) | Push-in com blur e o texto sai pela esquerda |
| 17,0–19,4 | Fecho de marca | Mascote sobre uma linha curva (horizonte); a linha atravessa e escreve o logo; hold | Fade para preto |
| 19,6–23,7 | Outro do criador | Ícone do Instagram com gradiente animado em rotação e o @ por baixo | — |

**Overlay fixo do reel** (por fora do monitor): uma frase de prova no topo ("100% criado con Opus 5.5") e uma CTA em baixo ("Prompt abajo ⬇️") para gerar comentários e partilhas.

## 3. Sistema visual

- **Paleta:** fundo `#05110D` a `#0B1A16` (preto-esverdeado com uma vinheta e um losango de luz desfocado ao fundo), primária néon `#58CC02` / `#7CFF4F` com glow, e acentos laranja (chama), azul, roxo e amarelo **só nas bordas** dos cards do carrossel.
- **Glow:** cada elemento verde tem 2 ou 3 sombras empilhadas (`0 0 6px`, `0 0 20px`, `0 0 60px` com opacidade a descer).
- **Materiais:** cards em glassmorphism (fundo translúcido, borda de 1–2 px colorida e reflexo suave); ícones e mascote em 3D (render ou gerados por IA com fundo removido).
- **Tipografia:** sans geométrica pesada e arredondada no logo; sans bold em caixa alta, com tracking largo, nos títulos.
- **Easing:** `expo.out` / `power4.out` nas entradas, `back.out(1.6)` nos pops (mascote, chips, dígitos) e `power2.inOut` nos movimentos de câmara. Nada linear, exceto o traço da linha (velocidade constante = sensação de "condução").
- **Apresentação:** o render final é colocado num monitor real (mockup ou filmagem do ecrã), com reflexo e luz ambiente. Isto acrescenta realismo e "prova" de que é um produto real.

## 4. Como reproduzir (Remotion ou HyperFrames + GSAP no sandbox)

### Arquitetura

- **Uma única composição de cerca de 20 s**, com as cenas em `<Sequence>` **sobrepostas 6 a 12 frames** (nunca em fila seca). A transição é desenhada dentro das duas cenas.
- **Componente `<GuideLine>` global**, por cima de todas as cenas: um `<path>` SVG cujo `d` e `strokeDashoffset` são interpolados por keyframes ao longo do vídeo inteiro. A cabeça é um `<circle>` posicionado com `getPointAtLength`. É a peça mais importante do estilo.
- **Câmara virtual:** um `<div>` raiz com `transform: perspective(1200px) translate3d(x,y,z) rotateX() rotateY() scale()` animado por keyframes. As cenas ficam dentro dele, para que todos os movimentos pareçam um só plano.
- **Motion blur:** `@remotion/motion-blur` (`<CameraMotionBlur samples={8} shutterAngle={180}>`) à volta da câmara, ou um `filter: blur()` proporcional à velocidade em cada elemento.
- **Profundidade de campo:** camadas de fundo e de primeiro plano com `blur(4–10px)`; o foco fica no plano do meio.

### Receitas de cada efeito

- **Linha que desenha:** `strokeDasharray = L; strokeDashoffset = interpolate(f, [a,b], [L,0], {easing: Easing.inOut(Easing.cubic)})`.
- **Texto revelado pela linha:** um `clipPath: inset(0 ${100-p}% 0 0)` sincronizado com a posição x da cabeça da linha.
- **Odómetro:** cada dígito é uma coluna 0–9 com `translateY(-digit*100%)` e spring (`damping 14`); trocar o valor-alvo em 1 → 7 → 30 → 100 → 200 → 365 com 10–12 frames entre trocas.
- **Chips a cair:** `spring` em y + `rotate` pequeno, com stagger de 4 frames e um `blur` que decresce com a velocidade.
- **Reorder do ranking:** a posição y de cada linha é calculada pelo índice e interpolada quando o índice muda (efeito FLIP).
- **Forma de onda:** 40–60 barras com altura `noise2D(i*0.3, f*0.15)` (`@remotion/noise`) multiplicada por um envelope.
- **Carrossel 3D:** os cards em `translateX(i*W)` e `rotateY(-12deg)`; a câmara faz pan com `power2.inOut`; os ícones têm parallax 1,3×.
- **Convergência:** 4 paths com início em cada card e fim num ponto comum, desenhados ao mesmo tempo, com stagger de 2 frames.
- **Shatter/partículas de entrada:** cerca de 30 quadrados pequenos com posição inicial aleatória (seed fixa) e tween para a origem, com fade.

### Ordem de produção recomendada

1. Escrever o guião em micro-cenas de 0,4–0,8 s e definir **a ação da linha em cada uma** (é o storyboard).
2. Desenhar primeiro a câmara e a `<GuideLine>` com as cenas em caixas cinzentas (animatic). Se o fluxo funcionar com caixas, vai funcionar com arte.
3. Gerar os assets 3D (mascote ou produto, ícones) com IA, remover o fundo e exportar PNG em alta resolução.
4. Vestir as cenas, aplicar glow, DOF e motion blur.
5. Pôr os SFX em cada transição (whoosh na câmara, click nos chips, tick no odómetro, impacto no logo).
6. Compor o render no mockup do monitor e adicionar os overlays do reel (frase de prova + CTA).

## 5. Checklist de qualidade

- [ ] Zero cortes secos: todas as transições passam por um objeto partilhado.
- [ ] A linha-guia aparece em pelo menos 70% do tempo.
- [ ] Nenhum plano parado mais de 0,6 s (exceto o hold final).
- [ ] Motion blur em tudo o que se move depressa.
- [ ] Uma só cor protagonista; as outras cores só como acento.
- [ ] Um SFX por transição.
- [ ] O fecho volta ao início (a mascote e a linha do início reaparecem no fim), para o vídeo se fechar em loop.
