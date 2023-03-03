const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
};

const Symbols = [
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png", // 黑桃
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png", // 愛心
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png", // 方塊
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png", // 梅花
];

const model = {
  revealedCards: [], //存放每次 翻開的牌
  score: 0,
  triedTimes: 0,
  startTime: Date.now(),

  isRevealedCardsMatched() {
    //檢查配對
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    ); //true or false
  },
};

const view = {
  getCardContent(index) {
    //根據數字運算來判斷花色及號碼
    const number = this.transfromNumber((index % 13) + 1);
    const symbol = Symbols[Math.floor(index / 13)];

    return `<p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>`;
  },

  getCardElement(index) {
    return `<div class="card back" data-index="${index}"></div>`;
  },

  transfromNumber(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return number;
    }
  },

  displayCards(indexes) {
    const rootElement = document.querySelector("#cards");
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index))
      .join("");
  },

  //翻牌動作
  flipCards(...cards) {
    cards.map((card) => {
      //如果是覆蓋狀態會包含back class name
      if (card.classList.contains("back")) {
        //return正面
        card.classList.remove("back");
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }
      //如果是翻開狀態，覆蓋回去，class name加入back
      card.classList.add("back");
      card.innerHTML = null; //清空內容
    });
  },

  pairCards(...cards) {
    //配對成功 牌面維持翻開
    cards.map((card) => {
      card.classList.add("paired");
    });
  },
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },
  renderTriedTimes(triedTimes) {
    document.querySelector(
      ".tried"
    ).textContent = `You've tried: ${triedTimes} times`;
  },
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add("wrong");
      card.addEventListener(
        "animationend",
        (event) => event.target.classList.remove("wrong"),
        { once: true }
      );
    });
  },
  showGameFinished() {
    const div = document.createElement("div");
    div.classList.add("completed");
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `;
    const header = document.querySelector("#header");
    header.before(div);
  },
  showGameTime() {
    const time = document.querySelector(".time");
    const currentTime = Date.now();
    const passTime = Math.ceil((currentTime - model.startTime) / 1000);
    const sec = passTime % 60;
    const min = Math.floor(passTime / 60) % 60;
    const hr = Math.floor(passTime / 60 / 60);
    time.textContent = `Time pass ${hr} : ${min} : ${sec}`;
  },
};

//洗牌函式
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

const controller = {
  currentState: GAME_STATE.FirstCardAwaits, //初始為尚未翻牌的狀態
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52));
    let startTiming = setInterval(function () {
      view.showGameTime();
    }, 1000);
  },

  dispatchCardAction(card) {
    if (!card.classList.contains("back")) {
      return;
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card);
        model.revealedCards.push(card);
        this.currentState = GAME_STATE.SecondCardAwaits;
        break;
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes);
        view.flipCards(card);
        model.revealedCards.push(card);
        //判斷配對成功與否
        if (model.isRevealedCardsMatched()) {
          //配對成功
          view.renderScore((model.score += 10));
          this.currentState = GAME_STATE.CardsMatched;
          view.pairCards(...model.revealedCards);
          model.revealedCards = []; //清空
          if (model.score === 260) {
            console.log("showGameFinished");
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished();
            return;
          }
          this.currentState = GAME_STATE.FirstCardAwaits; // 重設狀態
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed;
          view.appendWrongAnimation(...model.revealedCards);
          setTimeout(this.resetCards, 1500);
        }
        break;
    }
    console.log("this.currentStage:", this.currentState);
    console.log(
      "revealedCards",
      model.revealedCards.map((card) => card.dataset.index)
    );
  },

  resetCards() {
    view.flipCards(...model.revealedCards);
    model.revealedCards = []; //清空已翻開牌
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

controller.generateCards();

//監聽卡片點擊事件
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (event) => {
    controller.dispatchCardAction(card);
  });
});
