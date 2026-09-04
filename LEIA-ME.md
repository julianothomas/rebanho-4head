# Rebanho — Registro Nelore

App para registrar seus animais com foto, peso, arroba, genealogia, reprodução, sanidade e mais — funcionando **sem internet no campo**.

## Onde ficam os dados?

Todos os dados (incluindo as fotos) ficam salvos **dentro do próprio iPhone**, num banco de dados local do navegador (IndexedDB). Nada é enviado para nenhum servidor ou nuvem. Isso significa duas coisas importantes:

1. **Funciona 100% sem internet** depois de instalado — pode tirar foto e cadastrar animal no meio do pasto, sem sinal nenhum.
2. **Os dados vivem só nesse iPhone.** Se o aparelho for perdido, trocado ou tiver o app removido, os dados se perdem — por isso a tela **Backup** dentro do app deixa exportar um arquivo `.json` (backup completo com fotos) ou `.csv` (planilha simples, sem fotos, para abrir no Excel) sempre que você tiver acesso a e-mail, computador ou nuvem (iCloud, Google Drive, etc). Guarde esse arquivo com frequência.

## Como colocar isso para rodar no iPhone

Como é um app *web* (não passa pela App Store), ele precisa estar hospedado em algum endereço com **https** para poder ser instalado como app na tela inicial. É simples e gratuito. A forma mais fácil:

### Opção recomendada: GitHub Pages (gratuito, 10 minutos, sem programar)

1. Crie uma conta gratuita em https://github.com (se ainda não tiver).
2. Crie um novo repositório (botão verde "New"), pode ser privado ou público, ex: `meu-rebanho`.
3. Na página do repositório, clique em "Add file" → "Upload files" e arraste **todos os arquivos** desta pasta (`index.html`, `style.css`, `app.js`, `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png`).
4. Vá em **Settings** (do repositório) → **Pages** (menu à esquerda) → em "Source" escolha a branch `main` e pasta `/root` → **Save**.
5. Espere 1-2 minutos. O GitHub vai te dar um endereço tipo `https://seunome.github.io/meu-rebanho/`.

### Instalando no iPhone

1. Abra esse endereço no **Safari** do iPhone (tem que ser Safari, não Chrome).
2. Toque no ícone de compartilhar (quadrado com seta para cima).
3. Escolha **"Adicionar à Tela de Início"**.
4. Pronto — vai aparecer um ícone "Rebanho" na tela do iPhone, abrindo em tela cheia como um app de verdade.
5. Abra o app **uma vez com internet** para ele guardar tudo em cache. A partir daí, pode usar sem sinal nenhum, inclusive tirar fotos e cadastrar animais no pasto.

Se preferir outra forma de hospedar (Netlify, servidor próprio do escritório, etc.), é só colocar esses mesmos arquivos lá — o app não depende de nenhum serviço específico.

## O que o app registra por animal

- **Perfil:** Corte ou Leite — muda quais campos aparecem no formulário
- **Identificação:** nome, brinco/registro, sexo, data de nascimento, categoria, composição racial
- **Genealogia:** pai, mãe, linhagem/plantel
- **Peso e arroba:** histórico de pesagens, cálculo automático de arrobas (peso × rendimento de carcaça ÷ 30) e do GMD (ganho médio diário)
- **Produção leiteira** (perfil Leite): lactação oficial (kg) e controle leiteiro mensal (data + litros/dia)
- **Reprodução:** status (vazia / inseminada / prenhez confirmada / parida), tipo de cobertura (IA / embrião / monta natural), touro ou embrião utilizado, data da cobertura, previsão de parto (calculada automaticamente), data do parto e sexo do bezerro
- **Sanidade:** vacinas e tratamentos com data
- **Localização:** fazenda, lote de manejo, pasto atual
- **Lote de venda/leilão:** número do lote e tipo de oferta
- **Comercial:** status (ativo/vendido/abatido/morto), valor estimado
- **Fotos** (quantas quiser por animal) e observações livres

## Gerando um catálogo em PDF

Na aba **Catálogo**, escolha quais animais entram (por padrão, todos), preencha o título/data/contato do evento e toque em "Gerar catálogo em PDF". O app monta uma capa e uma página por animal, com foto, dados e um texto de comentários gerado automaticamente a partir do que você cadastrou (composição racial, lactação, reprodução etc.). O PDF é baixado direto no iPhone, funcionando também offline.

## Próximos passos possíveis

- Sincronização entre vários celulares (precisaria de um servidor central)
- Login com senha para proteger os dados
- Gráfico de evolução de peso ou de produção leiteira por animal
- Organizar o catálogo por lotes de leilão específicos (aguardando informações do modelo do Instagram)

Se quiser qualquer um desses, é só pedir.
