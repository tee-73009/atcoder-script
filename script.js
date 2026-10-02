window.GM_xmlhttpRequest = ({url, onload, onerror}) => { fetch(url, {cache: "no-store"}).then(async r => onload({status: r.status, responseText: await r.text()})).catch(onerror); };
window.GM_addStyle = css => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); };
window.GM_getValue = (k, d) => { const v = localStorage.getItem("GM_" + k); return v === null ? d : JSON.parse(v); };
window.GM_setValue = (k, v) => localStorage.setItem("GM_" + k, JSON.stringify(v));
(function(){
    // AtCoder Difficulty Display
    (function(){
/** GM_xmlhttpRequestをPromise化した汎用fetch */
const gmFetchJson = (url) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url, 
            onload: (res) => {
                if (res.status >= 200 && res.status < 300) {
                    try {
                        resolve(JSON.parse(res.responseText));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`HTTP ${res.status}`));
                }
            },
            onerror: (err) => reject(err),
            ontimeout: () => reject(new Error("timeout")),
        });
    });
};

const getProblems = () => gmFetchJson("https://cdn.jsdelivr.net/gh/tee-73009/atcoder-script@main/data/problems.json");
const getEstimatedDifficulties = () => gmFetchJson("https://cdn.jsdelivr.net/gh/tee-73009/atcoder-script@main/data/problem-models.json");
const getSubmissions = (userScreenName) => gmFetchJson("https://cdn.jsdelivr.net/gh/tee-73009/atcoder-script@main/data/submissions.json");
window.getSubmissions = getSubmissions;
const nonPenaltyJudge = ["AC", "CE", "IE", "WJ", "WR"];
/** 設定 ネタバレ防止のID, Key */
const hideDifficultyID = "hide-difficulty-atcoder-difficulty-display";
/**
 * 後方互換処理
 */
const backwardCompatibleProcessing = () => {
    const oldLocalStorageKeys = [
        "atcoderDifficultyDisplayUserSubmissions",
        "atcoderDifficultyDisplayUserSubmissionslastFetchedAt",
        "atcoderDifficultyDisplayEstimatedDifficulties",
        "atcoderDifficultyDisplayEstimatedDifficultieslastFetchedAt",
    ];
    /** 過去バージョンのlocalStorageデータを削除する */
    oldLocalStorageKeys.forEach((key) => {
        localStorage.removeItem(key);
    });
};
const getTypical90Difficulty = (title) => {
    if (title.includes("★1"))
        return 149;
    if (title.includes("★2"))
        return 399;
    if (title.includes("★3"))
        return 799;
    if (title.includes("★4"))
        return 1199;
    if (title.includes("★5"))
        return 1599;
    if (title.includes("★6"))
        return 1999;
    if (title.includes("★7"))
        return 2399;
    return NaN;
};
const getTypical90Description = (title) => {
    if (title.includes("★1"))
        return "200 点問題レベル";
    if (title.includes("★2"))
        return "300 点問題レベル";
    if (title.includes("★3"))
        return "";
    if (title.includes("★4"))
        return "400 点問題レベル";
    if (title.includes("★5"))
        return "500 点問題レベル";
    if (title.includes("★6"))
        return "これが安定して解ければ上級者です";
    if (title.includes("★7"))
        return "チャレンジ問題枠です";
    return "エラー: 競プロ典型 90 問の難易度読み取りに失敗しました";
};
const addTypical90Difficulty = (problemModels, problems) => {
    const models = problemModels;
    const problemsT90 = problems.filter((element) => element.contest_id === "typical90");
    problemsT90.forEach((element) => {
        const difficulty = getTypical90Difficulty(element.title);
        const model = {
            slope: NaN,
            intercept: NaN,
            variance: NaN,
            difficulty,
            discrimination: NaN,
            irt_loglikelihood: NaN,
            irt_users: NaN,
            is_experimental: false,
            extra_difficulty: `${getTypical90Description(element.title)}`,
        };
        models[element.id] = model;
    });
    return models;
};

// 次のコードを引用
// [AtCoderProblems/theme\.ts at master · kenkoooo/AtCoderProblems](https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/style/theme.ts)
// 8b1b86c740e627e59abf056a11c00582e12b30ff
const ThemeLight = {
    difficultyBlackColor: "#404040",
    difficultyGreyColor: "#808080",
    difficultyBrownColor: "#804000",
    difficultyGreenColor: "#008000",
    difficultyCyanColor: "#00C0C0",
    difficultyBlueColor: "#0000FF",
    difficultyYellowColor: "#C0C000",
    difficultyOrangeColor: "#FF8000",
    difficultyRedColor: "#FF0000",
};
({
    ...ThemeLight});

// 次のコードを引用・編集
// [AtCoderProblems/index\.ts at master · kenkoooo/AtCoderProblems](https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/index.ts)
// 5835f5dcacfa0cbdcc8ab1116939833d5ab71ed4
const clipDifficulty = (difficulty) => Math.round(difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400));
const RatingColors = [
    "Black",
    "Grey",
    "Brown",
    "Green",
    "Cyan",
    "Blue",
    "Yellow",
    "Orange",
    "Red",
];
const getRatingColor = (rating) => {
    const index = Math.min(Math.floor(rating / 400), RatingColors.length - 2);
    return RatingColors[index + 1] ?? "Black";
};
const getRatingColorClass = (rating) => {
    const ratingColor = getRatingColor(rating);
    switch (ratingColor) {
        case "Black":
            return "difficulty-black";
        case "Grey":
            return "difficulty-grey";
        case "Brown":
            return "difficulty-brown";
        case "Green":
            return "difficulty-green";
        case "Cyan":
            return "difficulty-cyan";
        case "Blue":
            return "difficulty-blue";
        case "Yellow":
            return "difficulty-yellow";
        case "Orange":
            return "difficulty-orange";
        case "Red":
            return "difficulty-red";
        default:
            return "difficulty-black";
    }
};
const getRatingColorCode = (ratingColor, theme = ThemeLight) => {
    switch (ratingColor) {
        case "Black":
            return theme.difficultyBlackColor;
        case "Grey":
            return theme.difficultyGreyColor;
        case "Brown":
            return theme.difficultyBrownColor;
        case "Green":
            return theme.difficultyGreenColor;
        case "Cyan":
            return theme.difficultyCyanColor;
        case "Blue":
            return theme.difficultyBlueColor;
        case "Yellow":
            return theme.difficultyYellowColor;
        case "Orange":
            return theme.difficultyOrangeColor;
        case "Red":
            return theme.difficultyRedColor;
        default:
            return theme.difficultyBlackColor;
    }
};

// 次のコードを引用・編集
// [AtCoderProblems/TopcoderLikeCircle\.tsx at master · kenkoooo/AtCoderProblems](https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/TopcoderLikeCircle.tsx)
// 02d7ed77d8d8a9fa8d32cb9981f18dfe53f2c5f0
// FIXME: ダークテーマ対応
const useTheme = () => ThemeLight;
const getRatingMetalColorCode = (metalColor) => {
    switch (metalColor) {
        case "Bronze":
            return { base: "#965C2C", highlight: "#FFDABD" };
        case "Silver":
            return { base: "#808080", highlight: "white" };
        case "Gold":
            return { base: "#FFD700", highlight: "white" };
        default:
            return { base: "#FFD700", highlight: "white" };
    }
};
const getStyleOptions = (color, fillRatio, theme) => {
    if (color === "Bronze" || color === "Silver" || color === "Gold") {
        const metalColor = getRatingMetalColorCode(color);
        return {
            borderColor: metalColor.base,
            background: `linear-gradient(to right, \
        ${metalColor.base}, ${metalColor.highlight}, ${metalColor.base})`,
        };
    }
    const colorCode = getRatingColorCode(color, theme);
    return {
        borderColor: colorCode,
        background: `border-box linear-gradient(to top, \
        ${colorCode} ${fillRatio * 100}%, \
        rgba(0,0,0,0) ${fillRatio * 100}%)`,
    };
};
const topcoderLikeCircle = (color, rating, big = true, extraDescription = "") => {
    const fillRatio = rating >= 3200 ? 1.0 : (rating % 400) / 400;
    const className = `topcoder-like-circle
  ${big ? "topcoder-like-circle-big" : ""} rating-circle`;
    const theme = useTheme();
    const styleOptions = getStyleOptions(color, fillRatio, theme);
    const styleOptionsString = `border-color: ${styleOptions.borderColor}; background: ${styleOptions.background};`;
    const content = extraDescription
        ? `Difficulty: ${extraDescription}`
        : `Difficulty: ${rating}`;
    // FIXME: TooltipにSolve Prob, Solve Timeを追加
    return `<span
            class="${className}" style="${styleOptionsString}"
            data-toggle="tooltip" title="${content}" data-placement="bottom"
          />`;
};

// 次のコードを引用・編集
// [AtCoderProblems/DifficultyCircle\.tsx at master · kenkoooo/AtCoderProblems](https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/components/DifficultyCircle.tsx)
// 0469e07274fda2282c9351c2308ed73880728e95
const getColor = (difficulty) => {
    if (difficulty < 3200)
        return getRatingColor(difficulty);
    if (difficulty < 3600)
        return "Bronze";
    if (difficulty < 4000)
        return "Silver";
    return "Gold";
};
const difficultyCircle = (difficulty, big = true, extraDescription = "") => {
    if (Number.isNaN(difficulty)) {
        // Unavailableの難易度円はProblemsとは異なりGlyphiconの「?」を使用
        const className = `glyphicon glyphicon-question-sign aria-hidden='true'
    difficulty-unavailable
    ${big ? "difficulty-unavailable-icon-big" : "difficulty-unavailable-icon"}`;
        const content = "Difficulty is unavailable.";
        return `<span
              class="${className}"
              data-toggle="tooltip" title="${content}" data-placement="bottom"
            />`;
    }
    const color = getColor(difficulty);
    return topcoderLikeCircle(color, difficulty, big, extraDescription);
};

var html = "<h2>atcoder-difficulty-display</h2>\n<hr />\n<a href=\"https://github.com/hotarunw/atcoder-difficulty-display\">GitHub</a>\n<div class=\"form-horizontal\">\n  <div class=\"form-group\">\n    <label class=\"control-label col-sm-3\">ネタバレ防止</label>\n    <div class=\"col-sm-5\">\n      <div class=\"checkbox\">\n        <label>\n          <input\n            type=\"checkbox\"\n            id=\"hide-difficulty-atcoder-difficulty-display\"\n          />\n          画面上のボタンを押した後に難易度が表示されるようにする\n        </label>\n      </div>\n    </div>\n  </div>\n</div>\n";

var css = ".difficulty-red {\n  color: #ff0000;\n}\n\n.difficulty-orange {\n  color: #ff8000;\n}\n\n.difficulty-yellow {\n  color: #c0c000;\n}\n\n.difficulty-blue {\n  color: #0000ff;\n}\n\n.difficulty-cyan {\n  color: #00c0c0;\n}\n\n.difficulty-green {\n  color: #008000;\n}\n\n.difficulty-brown {\n  color: #804000;\n}\n\n.difficulty-grey {\n  color: #808080;\n}\n\n.topcoder-like-circle {\n  display: block;\n  border-radius: 50%;\n  border-style: solid;\n  border-width: 1px;\n  width: 12px;\n  height: 12px;\n}\n\n.topcoder-like-circle-big {\n  border-width: 3px;\n  width: 36px;\n  height: 36px;\n}\n\n.rating-circle {\n  margin-right: 5px;\n  display: inline-block;\n}\n\n.difficulty-unavailable {\n  color: #17a2b8;\n}\n\n.difficulty-unavailable-icon {\n  margin-right: 0.3px;\n}\n\n.difficulty-unavailable-icon-big {\n  font-size: 36px;\n  margin-right: 5px;\n}\n\n.label-status-a {\n  color: white;\n}\n\n.label-success-after-contest {\n  background-color: #9ad59e;\n}\n\n.label-warning-after-contest {\n  background-color: #ffdd99;\n}";

// AtCoderの問題ページをパースする
/**
 * URLをパースする パラメータを消す \
 * 例: in:  https://atcoder.jp/contests/abc210?lang=en \
 * 例: out: (5)['https:', '', 'atcoder.jp', 'contests', 'abc210']
 */
const parseURL = (url) => {
    // 区切り文字`/`で分割する
    // ?以降の文字列を削除してパラメータを削除する
    return url.split("/").map((x) => x.replace(/\?.*/i, ""));
};
const URL = parseURL(window.location.href);
/**
 * 表セル要素から、前の要素のテキストが引数と一致する要素を探す
 * 個別の提出ページで使うことを想定
 * 例: searchSubmissionInfo(["問題", "Task"])
 */
const searchSubmissionInfo = (key) => {
    const tdTags = document.getElementsByTagName("td");
    const tdTagsArray = Array.prototype.slice.call(tdTags);
    return tdTagsArray.filter((elem) => {
        const prevElem = elem.previousElementSibling;
        const text = prevElem?.textContent;
        if (typeof text === "string")
            return key.includes(text);
        return false;
    })[0];
};
/** コンテストタイトル 例: AtCoder Beginner Contest 210 */
document.getElementsByClassName("contest-title")[0]?.textContent ?? "";
/** コンテストID 例: abc210 */
const contestID = URL[4] ?? "";
/**
 * ページ種類 \
 * 基本的にコンテストIDの次のパス
 * ### 例外
 * 個別の問題: task
 * 個別の提出: submission
 * 個別の問題ページで解説ボタンを押すと遷移する個別の問題の解説一覧ページ: task_editorial
 */
const pageType = (() => {
    if (URL.length < 6)
        return "";
    if (URL.length >= 7 && URL[5] === "submissions" && URL[6] !== "me")
        return "submission";
    if (URL.length >= 8 && URL[5] === "tasks" && URL[7] === "editorial")
        return "task_editorial";
    if (URL.length >= 7 && URL[5] === "tasks")
        return "task";
    return URL[5] ?? "";
})();
/** 問題ID 例: abc210_a */
const taskID = (() => {
    if (pageType === "task") {
        // 問題ページでは、URLから問題IDを取り出す
        return URL[6] ?? "";
    }
    if (pageType === "submission") {
        // 個別の提出ページでは、問題リンクのURLから問題IDを取り出す
        // 提出情報の問題のURLを取得する
        const taskCell = searchSubmissionInfo(["問題", "Task"]);
        if (!taskCell)
            return "";
        const taskLink = taskCell.getElementsByTagName("a")[0];
        if (!taskLink)
            return "";
        const taskUrl = parseURL(taskLink.href);
        const taskIDParsed = taskUrl[6] ?? "";
        return taskIDParsed;
    }
    return "";
})();
/** 問題名 例: A - Cabbages */
(() => {
    if (pageType === "task") {
        // 問題ページでは、h2から問題名を取り出す
        return (document
            .getElementsByClassName("h2")[0]
            ?.textContent?.trim()
            .replace(/\n.*/i, "") ?? "");
    }
    if (pageType === "submission") {
        // 個別の提出ページでは、問題リンクのテキストから問題名を取り出す
        // 提出情報の問題のテキストを取得する
        const taskCell = searchSubmissionInfo(["問題", "Task"]);
        if (!taskCell)
            return "";
        const taskLink = taskCell.getElementsByTagName("a")[0];
        if (!taskLink)
            return "";
        return taskLink.textContent ?? "";
    }
    return "";
})();
/** 提出ユーザー 例: machikane */
(() => {
    if (pageType !== "submission")
        return "";
    // 個別の提出ページのとき
    const userCell = searchSubmissionInfo(["ユーザ", "User"]);
    if (!userCell)
        return "";
    return userCell?.textContent?.trim() ?? "";
})();
/** 提出結果 例: AC */
(() => {
    if (pageType !== "submission")
        return "";
    // 個別の提出ページのとき
    const statusCell = searchSubmissionInfo(["結果", "Status"]);
    if (!statusCell)
        return "";
    return statusCell?.textContent?.trim() ?? "";
})();
/** 得点 例: 100 */
(() => {
    if (pageType !== "submission")
        return 0;
    // 個別の提出ページのとき
    const scoreCell = searchSubmissionInfo(["得点", "Score"]);
    if (!scoreCell)
        return 0;
    return parseInt(scoreCell?.textContent?.trim() ?? "0", 10);
})();

/**
 * 得点が最大の提出を返す
 */
const parseMaxScore = (submissionsArg) => {
    if (submissionsArg.length === 0) {
        return undefined;
    }
    const maxScore = submissionsArg.reduce((left, right) => left.point > right.point ? left : right);
    return maxScore;
};
/**
 * ペナルティ数を数える
 */
const parsePenalties = (submissionsArg) => {
    let penalties = 0;
    let hasAccepted = false;
    submissionsArg.forEach((element) => {
        hasAccepted = element.result === "AC" || hasAccepted;
        if (!hasAccepted && !nonPenaltyJudge.includes(element.result)) {
            penalties += 1;
        }
    });
    return penalties;
};
/**
 * 最初にACした提出を返す
 */
const parseFirstAcceptedTime = (submissionsArg) => {
    const ac = submissionsArg.filter((element) => element.result === "AC");
    return ac[0];
};
/**
 * 代表的な提出を返す
 * 1. 最後にACした提出
 * 2. 最後の提出
 * 3. undefined
 */
const parseRepresentativeSubmission = (submissionsArg) => {
    const ac = submissionsArg.filter((element) => element.result === "AC");
    const nonAC = submissionsArg.filter((element) => element.result !== "AC");
    if (ac.length > 0)
        return ac.slice(-1)[0];
    if (nonAC.length > 0)
        return nonAC.slice(-1)[0];
    return undefined;
};
/**
 * 提出をパースして情報を返す
 * 対象: コンテスト前,中,後の提出 別コンテストの同じ問題への提出
 * 返す情報: 得点が最大の提出 最初のACの提出 代表的な提出 ペナルティ数
 */
const analyzeSubmissions = (submissionsArg) => {
    const submissions = submissionsArg.filter((element) => element.problem_id === taskID);
    const beforeContest = submissions.filter((element) => element.contest_id === contestID &&
        element.epoch_second < startTime.unix());
    const duringContest = submissions.filter((element) => element.contest_id === contestID &&
        element.epoch_second >= startTime.unix() &&
        element.epoch_second < endTime.unix());
    const afterContest = submissions.filter((element) => element.contest_id === contestID && element.epoch_second >= endTime.unix());
    const anotherContest = submissions.filter((element) => element.contest_id !== contestID);
    return {
        before: {
            maxScore: parseMaxScore(beforeContest),
            firstAc: parseFirstAcceptedTime(beforeContest),
            representative: parseRepresentativeSubmission(beforeContest),
        },
        during: {
            maxScore: parseMaxScore(duringContest),
            firstAc: parseFirstAcceptedTime(duringContest),
            representative: parseRepresentativeSubmission(duringContest),
            penalties: parsePenalties(duringContest),
        },
        after: {
            maxScore: parseMaxScore(afterContest),
            firstAc: parseFirstAcceptedTime(afterContest),
            representative: parseRepresentativeSubmission(afterContest),
        },
        another: {
            maxScore: parseMaxScore(anotherContest),
            firstAc: parseFirstAcceptedTime(anotherContest),
            representative: parseRepresentativeSubmission(anotherContest),
        },
    };
};
/**
 * 提出状況を表すラベルを生成
 */
const generateStatusLabel = (submission, type) => {
    if (submission === undefined) {
        return "";
    }
    const isAC = submission.result === "AC";
    let className = "";
    switch (type) {
        case "before":
            className = "label-primary";
            break;
        case "during":
            className = isAC ? "label-success" : "label-warning";
            break;
        case "after":
            className = isAC
                ? "label-success-after-contest"
                : "label-warning-after-contest";
            break;
        case "another":
            className = "label-default";
            break;
    }
    let content = "";
    switch (type) {
        case "before":
            content = "コンテスト前の提出";
            break;
        case "during":
            content = "コンテスト中の提出";
            break;
        case "after":
            content = "コンテスト後の提出";
            break;
        case "another":
            content = "別コンテストの同じ問題への提出";
            break;
    }
    const href = `https://atcoder.jp/contests/${submission.contest_id}/submissions/${submission.id}`;
    return `<span class="label ${className}"
      data-toggle="tooltip" data-placement="bottom" title="${content}">
      <a class="label-status-a" href=${href}>${submission.result}</a>
    </span> `;
};
/**
 * ペナルティ数を表示
 */
const generatePenaltiesCount = (penalties) => {
    if (penalties <= 0) {
        return "";
    }
    const content = "コンテスト中のペナルティ数";
    return `<span data-toggle="tooltip" data-placement="bottom" title="${content}"class="difficulty-red" style='font-weight: bold; font-size: x-small;'>
            (${penalties.toString()})
          </span>`;
};
/**
 * 最初のACの時間を表示
 */
const generateFirstAcTime = (submission) => {
    if (submission === undefined) {
        return "";
    }
    const content = "提出時間";
    const href = `https://atcoder.jp/contests/${submission.contest_id}/submissions/${submission.id}`;
    const elapsed = submission.epoch_second - startTime.unix();
    const elapsedSeconds = elapsed % 60;
    const elapsedMinutes = Math.trunc(elapsed / 60);
    return `<span data-toggle="tooltip" data-placement="bottom" title="${content}">
          <a class="difficulty-orange" style='font-weight: bold; font-size: x-small;' href=${href}>
            ${elapsedMinutes}:${elapsedSeconds}
          </a>
        </span>`;
};
/**
 * マラソン用に得点を表示するスパンを生成
 */
const generateScoreSpan = (submission, type) => {
    if (submission === undefined) {
        return "";
    }
    // マラソン用を考えているのでとりあえず1万点未満は表示しない
    if (submission.point < 10000) {
        return "";
    }
    let className = "";
    switch (type) {
        case "before":
            className = "difficulty-blue";
            break;
        case "during":
            className = "difficulty-green";
            break;
        case "after":
            className = "difficulty-yellow";
            break;
        case "another":
            className = "difficulty-grey";
            break;
    }
    let content = "";
    switch (type) {
        case "before":
            content = "コンテスト前の提出";
            break;
        case "during":
            content = "コンテスト中の提出";
            break;
        case "after":
            content = "コンテスト後の提出";
            break;
        case "another":
            content = "別コンテストの同じ問題への提出";
            break;
    }
    const href = `https://atcoder.jp/contests/${submission.contest_id}/submissions/${submission.id}`;
    return `<span
      data-toggle="tooltip" data-placement="bottom" title="${content}">
        <a class="${className}" style='font-weight: bold;' href=${href}>
          ${submission.point}
        </a>
    </span> `;
};

/**
 * 色付け対象の要素の配列を取得する
 * * 個別の問題ページのタイトル
 * * 問題へのリンク
 * * 解説ページのH3の問題名
 */
const getElementsColorizable = () => {
    const elementsColorizable = [];
    // 問題ページのタイトル
    if (pageType === "task") {
        const element = document.getElementsByClassName("h2")[0];
        if (element) {
            elementsColorizable.push({ element, taskID, big: true });
        }
    }
    // aタグ要素 問題ページ、提出ページ等のリンクを想定
    const aTagsRaw = document.getElementsByTagName("a");
    let aTagsArray = Array.prototype.slice.call(aTagsRaw);
    // 問題ページの一番左の要素は除く 見た目の問題です
    aTagsArray = aTagsArray.filter((element) => !((pageType === "tasks" || pageType === "score") &&
        !element.parentElement?.previousElementSibling));
    // 左上の日本語/英語切り替えリンクは除く
    aTagsArray = aTagsArray.filter((element) => !element.href.includes("?lang="));
    // 解説ページの問題名の右のリンクは除く
    aTagsArray = aTagsArray.filter((element) => !(pageType === "editorial" &&
        element.children[0]?.classList.contains("glyphicon-new-window")));
    const aTagsConverted = aTagsArray.map((element) => {
        const url = parseURL(element.href);
        const taskIDFromURL = (url[url.length - 2] ?? "") === "tasks" ? url[url.length - 1] ?? "" : "";
        // 個別の解説ページではbig
        const big = element.parentElement?.tagName.includes("H2") ?? false;
        // Comfortable AtCoderのドロップダウンではafterbegin
        const afterbegin = element.parentElement?.parentElement?.classList.contains("dropdown-menu") ?? false;
        return { element, taskID: taskIDFromURL, big, afterbegin };
    });
    elementsColorizable.push(...aTagsConverted);
    // h3タグ要素 解説ページの問題名を想定
    const h3TagsRaw = document.getElementsByTagName("h3");
    const h3TagsArray = Array.prototype.slice.call(h3TagsRaw);
    const h3TagsConverted = h3TagsArray.map((element) => {
        const url = parseURL(element.getElementsByTagName("a")[0]?.href ?? "");
        const taskIDFromURL = (url[url.length - 2] ?? "") === "tasks" ? url[url.length - 1] ?? "" : "";
        return { element, taskID: taskIDFromURL, big: true, afterbegin: true };
    });
    // FIXME: 別ユーザースクリプトが指定した要素を色付けする機能
    // 指定したクラスがあれば対象とすることを考えている
    // ユーザースクリプトの実行順はユーザースクリプトマネージャーの設定で変更可能
    elementsColorizable.push(...h3TagsConverted);
    return elementsColorizable;
};
/**
 * 問題ステータス（実行時間制限とメモリ制限が書かれた部分）のHTMLオブジェクトを取得
 */
const getElementOfProblemStatus = () => {
    if (pageType !== "task")
        return undefined;
    const psRaw = document
        ?.getElementById("main-container")
        ?.getElementsByTagName("p");
    const ps = Array.prototype.slice.call(psRaw);
    if (!psRaw)
        return undefined;
    const problemStatuses = ps.filter((p) => {
        return (p.textContent?.includes("メモリ制限") ||
            p.textContent?.includes("Memory Limit"));
    });
    return problemStatuses[0];
};

/** 常設コンテストID一覧 */
const permanentContestIDs = [
    "practice",
    "APG4b",
    "abs",
    "practice2",
    "typical90",
    "math-and-algorithm",
    "tessoku-book",
];
// FIXME: FIXME: Problemsでデータ取れなかったらコンテストが終了していない判定で良さそう
/**
 * 開いているページのコンテストが終了していればtrue \
 * 例外処理として以下の場合もtrueを返す
 * * コンテストが常設コンテスト
 * * コンテストのページ以外にいる <https://atcoder.jp/contests/*>
 */
var isContestOver = () => {
    if (!(URL[3] === "contests" && URL.length >= 5))
        return true;
    if (permanentContestIDs.includes(contestID))
        return true;
    return Date.now() > endTime.valueOf();
};

/**
 * コンテストページ <https://atcoder.jp/contests/*> の処理 \
 * メインの処理
 */
const contestPageProcess = async () => {
    // FIXME: ダークテーマ対応
    GM_addStyle(css);
    /** 問題一覧取得 */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const problems = await getProblems();
    /** 難易度取得 */
    const problemModels = addTypical90Difficulty(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await getEstimatedDifficulties(), problems);
    // FIXME: PAST対応
    // FIXME: JOI非公式難易度表対応
    /** 提出状況取得 */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const submissions = await getSubmissions(userScreenName);
    // 色付け対象の要素の配列を取得する
    // 難易度が無いものを除く
    const elementsColorizable = getElementsColorizable().filter((element) => element.taskID in problemModels);
    // 問題ステータス（個別の問題ページの実行時間制限とメモリ制限が書かれた部分）を取得する
    const elementProblemStatus = getElementOfProblemStatus();
    /**
     * 色付け処理を実行する
     */
    const colorizeElement = () => {
        // 問題見出し、問題リンクを色付け
        elementsColorizable.forEach((element) => {
            const model = problemModels[element.taskID];
            // 難易度がUnavailableならばdifficultyプロパティが無い
            // difficultyの値をNaNとする
            const difficulty = clipDifficulty(model?.difficulty ?? NaN);
            // 色付け
            if (!Number.isNaN(difficulty)) {
                const color = getRatingColorClass(difficulty);
                // eslint-disable-next-line no-param-reassign
                element.element.classList.add(color);
            }
            else {
                element.element.classList.add("difficulty-unavailable");
            }
            // 🧪追加
            if (model?.is_experimental) {
                element.element.insertAdjacentText("afterbegin", "🧪");
            }
            // ◒難易度円追加
            element.element.insertAdjacentHTML(element.afterbegin ? "afterbegin" : "beforebegin", difficultyCircle(difficulty, element.big, model?.extra_difficulty));
        });
        // 個別の問題ページのところに難易度等情報を追加
        if (elementProblemStatus) {
            // 難易度の値を表示する
            // 難易度推定の対象外なら、この値はundefined
            const model = problemModels[taskID];
            // 難易度がUnavailableのときはdifficultyの値をNaNとする
            // 難易度がUnavailableならばdifficultyプロパティが無い
            const difficulty = clipDifficulty(model?.difficulty ?? NaN);
            // 色付け
            let className = "";
            if (difficulty) {
                className = getRatingColorClass(difficulty);
            }
            else if (model) {
                className = "difficulty-unavailable";
            }
            else {
                className = "";
            }
            // Difficultyの値設定
            let value = "";
            if (difficulty) {
                value = difficulty.toString();
            }
            else if (model) {
                value = "Unavailable";
            }
            else {
                value = "None";
            }
            // 🧪追加
            const experimentalText = model?.is_experimental ? "🧪" : "";
            const content = `${experimentalText}${value}`;
            elementProblemStatus.insertAdjacentHTML("beforeend", ` / Difficulty:
        <span style='font-weight: bold;' class="${className}">${content}</span>`);
            /** この問題への提出 提出時間ソート済みと想定 */
            const thisTaskSubmissions = submissions.filter((element) => element.problem_id === taskID);
            const analyze = analyzeSubmissions(thisTaskSubmissions);
            // コンテスト前中後外の提出状況 コンテスト中の解答時間とペナルティ数を表示する
            let statuesHTML = "";
            statuesHTML += generateStatusLabel(analyze.before.representative, "before");
            statuesHTML += generateStatusLabel(analyze.during.representative, "during");
            statuesHTML += generateStatusLabel(analyze.after.representative, "after");
            statuesHTML += generateStatusLabel(analyze.another.representative, "another");
            statuesHTML += generatePenaltiesCount(analyze.during.penalties);
            statuesHTML += generateFirstAcTime(analyze.during.firstAc);
            if (statuesHTML.length > 0) {
                elementProblemStatus.insertAdjacentHTML("beforeend", ` / Status: ${statuesHTML}`);
            }
            // コンテスト前中後外の1万点以上の最大得点を表示する
            // NOTE: マラソン用のため、1万点以上とした
            let scoresHTML = "";
            scoresHTML += generateScoreSpan(analyze.before.maxScore, "before");
            scoresHTML += generateScoreSpan(analyze.during.maxScore, "during");
            scoresHTML += generateScoreSpan(analyze.after.maxScore, "after");
            scoresHTML += generateScoreSpan(analyze.another.maxScore, "another");
            if (scoresHTML.length > 0) {
                elementProblemStatus.insertAdjacentHTML("beforeend", ` / Scores: ${scoresHTML}`);
            }
        }
        // bootstrap3のtooltipを有効化 難易度円の値を表示するtooltip
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, no-undef
        $('[data-toggle="tooltip"]').tooltip();
    };
    /** 今見ている問題(taskID)が使い回しで難易度判明済みかどうか */
    const contestOver = isContestOver();
    /**
     * コンテスト中に、使い回しにより難易度が判明している問題が
     * このページ内に(個別問題ページ or 一覧ページのいずれかで)存在するか
     */
    const hasKnownDifficultyDuringContest = !contestOver && ((taskID !== "" && taskID in problemModels) || elementsColorizable.length > 0);

    if (contestOver) {
        // ===== 既存のロジック(コンテスト終了後) =====
        if (!GM_getValue(hideDifficultyID, false)) {
            colorizeElement();
        } else {
            const place = document.getElementsByTagName("h2")[0] ??
                document.getElementsByClassName("h2")[0] ??
                undefined;
            if (place) {
                place.insertAdjacentHTML("beforebegin", `<input type="button" id="${hideDifficultyID}" class="btn btn-info"
                    value="Show Difficulty" />`);
                const button = document.getElementById(hideDifficultyID);
                if (button) {
                    button.addEventListener("click", () => {
                        button.style.display = "none";
                        colorizeElement();
                    });
                }
            }
        }
    } else if (hasKnownDifficultyDuringContest) {
        // ===== コンテスト中だが、使い回しで難易度が判明している問題がある場合 =====
        // (個別問題ページ・一覧ページ共通)
        // 設定(hideDifficultyID)に関わらず、常にボタンを表示してから押下でColorize
        const place = document.getElementsByTagName("h2")[0] ??
            document.getElementsByClassName("h2")[0] ??
            undefined;
        if (place) {
            const reusedButtonID = "show-difficulty-reused-problem";
            place.insertAdjacentHTML("beforebegin", `<input type="button" id="${reusedButtonID}" class="btn btn-info"
                value="Show Difficulty (Reused Problem)" />`);
            const button = document.getElementById(reusedButtonID);
            if (button) {
                button.addEventListener("click", () => {
                    button.style.display = "none";
                    colorizeElement();
                });
            }
        }
    }

    // else: コンテスト中かつ難易度不明 → 何もしない(従来通り)

    // bootstrap3のtooltipを有効化 (押下後にcolorizeElementが呼ばれた際に有効になる)
};
/**
 * 設定ページ <https://atcoder.jp/settings> の処理 \
 * 設定ボタンを追加する
 */
const settingPageProcess = () => {
    const insertion = document.getElementsByClassName("form-horizontal")[0];
    if (insertion === undefined)
        return;
    insertion.insertAdjacentHTML("afterend", html);
    // 設定 ネタバレ防止のチェックボックスの読み込み 切り替え 保存処理を追加
    const hideDifficultyChechbox = document.getElementById(hideDifficultyID);
    if (hideDifficultyChechbox &&
        hideDifficultyChechbox instanceof HTMLInputElement) {
        hideDifficultyChechbox.checked = GM_getValue(hideDifficultyID, false);
        hideDifficultyChechbox.addEventListener("change", () => {
            GM_setValue(hideDifficultyID, hideDifficultyChechbox.checked);
        });
    }
};
/**
 * 最初に実行される部分 \
 * 共通の処理を実行した後ページごとの処理を実行する
 */
(async () => {
    // 共通の処理
    backwardCompatibleProcessing();
    // ページ別の処理
    if (URL[3] === "contests" && URL.length >= 5) {
        await contestPageProcess();
    }
    if (URL[3] === "settings" && URL.length === 4) {
        settingPageProcess();
    }
})().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[atcoder-difficulty-display]", error);
    alert("difficulty: " + error);
});
    })();
    // Atcoder Easy Test v2
    (function(){
    if (typeof GM_getValue !== "function") {
        if (typeof GM === "object" && typeof GM.getValue === "function") {
            GM_getValue = GM.getValue;
            GM_setValue = GM.setValeu;
        } else {
            const storage = JSON.parse(localStorage.AtCoderEasyTest || "{}");
            GM_getValue = (key, defaultValue = null) => ((key in storage) ? storage[key] : defaultValue);
            GM_setValue = (key, value) => {
                storage[key] = value;
                localStorage.AtCoderEasyTest = JSON.stringify(storage);
            };
        }
    }

    if (typeof unsafeWindow !== "object") unsafeWindow = window;
function buildParams(data) {
    return Object.entries(data).map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
}
function sleep(ms) {
    return new Promise(done => setTimeout(done, ms));
}
function doneOrFail(p) {
    return p.then(() => Promise.resolve(), () => Promise.resolve());
}
function html2element(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstChild;
}
function newElement(tagName, attrs = {}, children = []) {
    const e = document.createElement(tagName);
    for (const [key, value] of Object.entries(attrs)) {
        if (key == "style") {
            for (const [propKey, propValue] of Object.entries(value)) {
                e.style[propKey] = propValue;
            }
        }
        else {
            e[key] = value;
        }
    }
    for (const child of children) {
        e.appendChild(child);
    }
    return e;
}
function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
        replace(/x/g, () => "0123456789abcdef"[Math.random() * 16 | 0]).
        replace(/y/g, () => "89ab"[Math.random() * 4 | 0]);
}
async function loadScript(src, ctx = null, env = {}) {
    const js = await fetch(src).then(res => res.text());
    const keys = [];
    const values = [];
    for (const [key, value] of Object.entries(env)) {
        keys.push(key);
        values.push(value);
    }
    unsafeWindow["Function"](keys.join(), js).apply(ctx, values);
}
const eventListeners = {};
const events = {
    on(name, listener) {
        const listeners = (name in eventListeners ? eventListeners[name] : eventListeners[name] = []);
        listeners.push(listener);
    },
    trig(name) {
        if (name in eventListeners) {
            for (const listener of eventListeners[name])
                listener();
        }
    },
};
class ObservableValue {
    _value;
    _listeners;
    constructor(value) {
        this._value = value;
        this._listeners = new Set();
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        for (const listener of this._listeners)
            listener(value);
    }
    addListener(listener) {
        this._listeners.add(listener);
        listener(this._value);
    }
    removeListener(listener) {
        this._listeners.delete(listener);
    }
    map(f) {
        const y = new ObservableValue(f(this.value));
        this.addListener(x => {
            y.value = f(x);
        });
        return y;
    }
}

var hPage = "<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n    <title>AtCoder Easy Test</title>\n    <link href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css\" rel=\"stylesheet\">\n  </head>\n  <body>\n    <div class=\"container\" id=\"root\">\n    </div>\n    <script src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js\"></script>\n    <script src=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js\"></script>\n  </body>\n</html>";

const components = [];
const settings = {
    add(title, generator) {
        components.push({ title, generator });
    },
    open() {
        const win = window.open("about:blank");
        const doc = win.document;
        doc.open();
        doc.write(hPage);
        doc.close();
        const root = doc.getElementById("root");
        for (const { title, generator } of components) {
            const panel = newElement("div", { className: "panel panel-default" }, [
                newElement("div", { className: "panel-heading", textContent: title }),
                newElement("div", { className: "panel-body" }, [generator(win)]),
            ]);
            root.appendChild(panel);
        }
    },
};

const options = [];
let data = {};
function toString() {
    return JSON.stringify(data);
}
function save() {
    GM_setValue("config", toString());
}
function load() {
    data = JSON.parse(GM_getValue("config") || "{}");
}
function reset() {
    data = {};
    save();
}
load();
// 設定ページ
settings.add("config", (win) => {
    const root = newElement("form", { className: "form-horizontal" });
    options.sort((a, b) => {
        const x = a.key.split(".");
        const y = b.key.split(".");
        return x < y ? -1 : x > y ? 1 : 0;
    });
    for (const { type, key, defaultValue, description } of options) {
        const id = uuid();
        const control = newElement("div", { className: "col-sm-3 text-center" });
        const group = newElement("div", { className: "form-group" }, [
            control,
            newElement("label", {
                className: "col-sm-3",
                htmlFor: id,
                textContent: key,
                style: {
                    fontFamily: "monospace",
                },
            }),
            newElement("label", {
                className: "col-sm-6",
                htmlFor: id,
                textContent: description,
            }),
        ]);
        root.appendChild(group);
        switch (type) {
            case "flag": {
                control.appendChild(newElement("input", {
                    id,
                    type: "checkbox",
                    checked: config.get(key, defaultValue),
                    onchange() {
                        config.set(key, this.checked);
                    },
                }));
                break;
            }
            case "count": {
                control.appendChild(newElement("input", {
                    id,
                    type: "number",
                    min: "0",
                    value: config.get(key, defaultValue),
                    onchange() {
                        config.set(key, +this.value);
                    },
                }));
                break;
            }
            case "text": {
                control.appendChild(newElement("input", {
                    id,
                    type: "text",
                    value: config.getString(key, defaultValue),
                    onchange() {
                        config.setString(key, this.value);
                    },
                }));
                break;
            }
            default:
                throw new TypeError(`AtCoderEasyTest.setting: undefined option type ${type} for ${key}`);
        }
    }
    root.appendChild(newElement("button", {
        className: "btn btn-danger",
        textContent: "Reset",
        type: "button",
        onclick() {
            if (win.confirm("Configuration data will be cleared. Are you sure?")) {
                config.reset();
            }
        },
    }));
    return root;
});
const config = {
    getString(key, defaultValue = "") {
        if (!(key in data))
            config.setString(key, defaultValue);
        return data[key];
    },
    setString(key, value) {
        data[key] = value;
        save();
    },
    has(key) {
        return key in data;
    },
    get(key, defaultValue = null) {
        if (!(key in data))
            config.set(key, defaultValue);
        return JSON.parse(data[key]);
    },
    set(key, value) {
        config.setString(key, JSON.stringify(value));
    },
    save,
    load,
    toString,
    reset,
    /** 設定項目を登録 */
    registerFlag(key, defaultValue, description) {
        options.push({
            type: "flag",
            key,
            defaultValue,
            description,
        });
    },
    registerCount(key, defaultValue, description) {
        options.push({
            type: "count",
            key,
            defaultValue,
            description,
        });
    },
    registerText(key, defaultValue, description) {
        options.push({
            type: "text",
            key,
            defaultValue,
            description,
        });
    },
};

config.registerCount("codeSaver.limit", 10, "Max number to save codes");
const codeSaver = {
    get() {
        // `json` は、ソースコード文字列またはJSON文字列
        let json = unsafeWindow.localStorage.AtCoderEasyTest$lastCode;
        let data = [];
        try {
            if (typeof json == "string") {
                data.push(...JSON.parse(json));
            }
            else {
                data = [];
            }
        }
        catch (e) {
            data.push({
                path: unsafeWindow.localStorage.AtCoderEasyTset$lastPage,
                code: json,
            });
        }
        return data;
    },
    set(data) {
        unsafeWindow.localStorage.AtCoderEasyTest$lastCode = JSON.stringify(data);
    },
    save(savePath, code) {
        let data = codeSaver.get();
        const idx = data.findIndex(({ path }) => path == savePath);
        if (idx != -1)
            data.splice(idx, idx + 1);
        data.push({
            path: savePath,
            code,
        });
        while (data.length > config.get("codeSaver.limit", 10))
            data.shift();
        codeSaver.set(data);
    },
    restore(savedPath) {
        const data = codeSaver.get();
        const idx = data.findIndex(({ path }) => path === savedPath);
        if (idx == -1 || !(data[idx] instanceof Object))
            return Promise.reject(`No saved code found for ${location.pathname}`);
        return Promise.resolve(data[idx].code);
    }
};
settings.add(`codeSaver (${location.host})`, (win) => {
    const root = newElement("table", { className: "table" }, [
        newElement("thead", {}, [
            newElement("tr", {}, [
                newElement("th", { textContent: "path" }),
                newElement("th", { textContent: "code" }),
            ]),
        ]),
        newElement("tbody"),
    ]);
    root.tBodies;
    for (const savedCode of codeSaver.get()) {
        root.tBodies[0].appendChild(newElement("tr", {}, [
            newElement("td", { textContent: savedCode.path }),
            newElement("td", {}, [
                newElement("textarea", {
                    rows: 1,
                    cols: 30,
                    textContent: savedCode.code,
                }),
            ]),
        ]));
    }
    return root;
});

function similarLangs(targetLang, candidateLangs) {
    const [targetName, targetDetail] = targetLang.split(" ", 2);
    const selectedLangs = candidateLangs.filter(candidateLang => {
        const [name, _] = candidateLang.split(" ", 2);
        return name == targetName;
    }).map(candidateLang => {
        const [_, detail] = candidateLang.split(" ", 2);
        return [candidateLang, similarity(detail, targetDetail)];
    });
    return selectedLangs.sort((a, b) => a[1] - b[1]).map(([lang, _]) => lang);
}
function similarity(s, t) {
    const n = s.length, m = t.length;
    let dp = new Array(m + 1).fill(0);
    for (let i = 0; i < n; i++) {
        const dp2 = new Array(m + 1).fill(0);
        for (let j = 0; j < m; j++) {
            const cost = (s.charCodeAt(i) - t.charCodeAt(j)) ** 2;
            dp2[j + 1] = Math.min(dp[j] + cost, dp[j + 1] + cost * 0.25, dp2[j] + cost * 0.25);
        }
        dp = dp2;
    }
    return dp[m];
}

class CodeRunner {
    get label() {
        return this._label;
    }
    constructor(label, site) {
        this._label = `${label} [${site}]`;
    }
    async test(sourceCode, input, expectedOutput, options) {
        let result = { status: "IE", input };
        try {
            result = await this.run(sourceCode, input, options);
        }
        catch (e) {
            result.error = e.toString();
            return result;
        }
        if (expectedOutput != null)
            result.expectedOutput = expectedOutput;
        if (result.status != "OK" || typeof expectedOutput != "string")
            return result;
        let output = result.output || "";
        if (options.trim) {
            expectedOutput = expectedOutput.trim();
            output = output.trim();
        }
        let equals = (x, y) => x === y;
        if (options.allowableError) {
            const floatPattern = /^[-+]?[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?$/;
            const superEquals = equals;
            equals = (x, y) => {
                if (floatPattern.test(x) || floatPattern.test(y)) {
                    const a = parseFloat(x);
                    const b = parseFloat(y);
                    return Math.abs(a - b) <= Math.max(options.allowableError, Math.abs(b) * options.allowableError);
                }
                return superEquals(x, y);
            };
        }
        if (options.split) {
            const superEquals = equals;
            equals = (x, y) => {
                const xs = x.split(/\s+/);
                const ys = y.split(/\s+/);
                if (xs.length != ys.length)
                    return false;
                const len = xs.length;
                for (let i = 0; i < len; i++) {
                    if (!superEquals(xs[i], ys[i]))
                        return false;
                }
                return true;
            };
        }
        result.status = equals(output, expectedOutput) ? "AC" : "WA";
        return result;
    }
}

class CustomRunner extends CodeRunner {
    run;
    constructor(label, run) {
        super(label, "Browser");
        this.run = run;
    }
}

let waitAtCoderCustomTest = Promise.resolve();
const AtCoderCustomTestBase = location.href.replace(/\/tasks\/.+$/, "/custom_test");
const AtCoderCustomTestResultAPI = AtCoderCustomTestBase + "/json?reload=true";
const AtCoderCustomTestSubmitAPI = AtCoderCustomTestBase + "/submit/json";
const ce_groups = new Set();
class AtCoderRunner extends CodeRunner {
    languageId;
    constructor(languageId, label) {
        super(label, "AtCoder");
        this.languageId = languageId;
    }
    async run(sourceCode, input, options = {}) {
        const promise = this.submit(sourceCode, input, options);
        waitAtCoderCustomTest = promise;
        return await promise;
    }
    async submit(sourceCode, input, options = {}) {
        try {
            await waitAtCoderCustomTest;
        }
        catch (error) {
            console.error(error);
        }
        // 同じグループで CE なら実行を省略し CE を返す
        if ("runGroupId" in options && ce_groups.has(options.runGroupId)) {
            return {
                status: "CE",
                input,
            };
        }
        const error = await fetch(AtCoderCustomTestSubmitAPI, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: buildParams({
                "data.LanguageId": String(this.languageId),
                sourceCode,
                input,
                csrf_token: unsafeWindow.csrfToken,
            }),
        }).then(r => r.text());
        if (error) {
            throw new Error(error);
        }
        await sleep(100);
        for (;;) {
            const data = await fetch(AtCoderCustomTestResultAPI, {
                method: "GET",
                credentials: "include",
            }).then(r => r.json());
            if (!("Result" in data))
                continue;
            const result = data.Result;
            if ("Interval" in data) {
                await sleep(data.Interval);
                continue;
            }
            const status = (result.ExitCode == 0) ? "OK" : (result.TimeConsumption.toString().startsWith("-")) ? "CE" : "RE";
            if (status == "CE" && "runGroupId" in options) {
                ce_groups.add(options.runGroupId);
            }
            return {
                status,
                exitCode: result.ExitCode,
                execTime: parseInt(result.TimeConsumption),
                memory: parseInt(result.MemoryConsumption),
                input,
                output: data.Stdout,
                error: data.Stderr,
            };
        }
    }
}

class PaizaIORunner extends CodeRunner {
    name;
    constructor(name, label) {
        super(label, "PaizaIO");
        this.name = name;
    }
    async run(sourceCode, input, options = {}) {
        let id, status, error;
        try {
            const res = await fetch("https://api.paiza.io/runners/create?" + buildParams({
                source_code: sourceCode,
                language: this.name,
                input,
                longpoll: "true",
                longpoll_timeout: "10",
                api_key: "guest",
            }), {
                method: "POST",
                mode: "cors",
            }).then(r => r.json());
            id = res.id;
            status = res.status;
            error = res.error;
        }
        catch (error) {
            return {
                status: "IE",
                input,
                error: String(error),
            };
        }
        while (status == "running") {
            const res = await fetch("https://api.paiza.io/runners/get_status?" + buildParams({
                id,
                api_key: "guest",
            }), {
                mode: "cors",
            }).then(res => res.json());
            status = res.status;
            error = res.error;
        }
        const res = await fetch("https://api.paiza.io/runners/get_details?" + buildParams({
            id,
            api_key: "guest",
        }), {
            mode: "cors",
        }).then(r => r.json());
        const result = {
            status: "OK",
            exitCode: String(res.exit_code),
            execTime: +res.time * 1e3,
            memory: +res.memory * 1e-3,
            input,
        };
        if (res.build_result == "failure") {
            result.status = "CE";
            result.exitCode = res.build_exit_code;
            result.output = res.build_stdout;
            result.error = res.build_stderr;
        }
        else {
            result.status = (res.result == "timeout") ? "TLE" : (res.result == "failure") ? "RE" : "OK";
            result.exitCode = res.exit_code;
            result.output = res.stdout;
            result.error = res.stderr;
        }
        return result;
    }
}

async function loadPyodide() {
    const script = await fetch("https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js").then((res) => res.text());
    unsafeWindow["Function"](script)();
    const pyodide = await unsafeWindow["loadPyodide"]({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.0/full/",
    });
    await pyodide.runPythonAsync(`
import contextlib, io, platform
class __redirect_stdin(contextlib._RedirectStream):
  _stream = "stdin"
`);
    return pyodide;
}
let _pyodide = Promise.reject("Pyodide is not yet loaded");
let _serial = Promise.resolve();
const pyodideRunner = new CustomRunner("Pyodide", (sourceCode, input, options = {}) => new Promise((resolve, reject) => {
    _serial = _serial.finally(async () => {
        const pyodide = await (_pyodide = _pyodide.catch(loadPyodide));
        const code = `
def __run():
 global __stdout, __stderr, __stdin, __code
 with __redirect_stdin(io.StringIO(__stdin)):
  with contextlib.redirect_stdout(io.StringIO()) as __stdout:
   with contextlib.redirect_stderr(io.StringIO()) as __stderr:
    try:
     pass
` +
            sourceCode
                .split("\n")
                .map((line) => "     " + line)
                .join("\n") +
            `
    except SystemExit as e:
     __code = e.code
`;
        let status = "OK";
        let exitCode = "0";
        let stdout = "";
        let stderr = "";
        let startTime = -Infinity;
        let endTime = Infinity;
        pyodide.globals.set("__stdin", input);
        try {
            pyodide.globals.set("__code", null);
            await pyodide.loadPackagesFromImports(code);
            await pyodide.runPythonAsync(code);
            startTime = Date.now();
            pyodide.runPython("__run()");
            endTime = Date.now();
            stdout = pyodide.globals.get("__stdout").getvalue();
            stderr = pyodide.globals.get("__stderr").getvalue();
            const __code = pyodide.globals.get("__code");
            if (typeof __code == "number") {
                exitCode = String(__code);
                if (__code != 0)
                    status = "RE";
            }
        }
        catch (error) {
            status = "RE";
            exitCode = "-1";
            stderr += error.toString();
        }
        resolve({
            status,
            exitCode,
            execTime: endTime - startTime,
            input,
            output: stdout,
            error: stderr,
        });
    });
}));

function pairs(list) {
    const pairs = [];
    const len = list.length >> 1;
    for (let i = 0; i < len; i++)
        pairs.push([list[i * 2], list[i * 2 + 1]]);
    return pairs;
}
async function init$5() {
    if (location.host != "atcoder.jp")
        throw "Not AtCoder";
    const doc = unsafeWindow.document;
    // "言語名 その他の説明..." となっている
    // 注意:
    // * 言語名にはスペースが入ってはいけない（スペース以降は説明とみなされる）
    // * Python2 の言語名は「Python」、 Python3 の言語名は「Python3」
    const langMap = {
        4001: "C GCC 9.2.1",
        4002: "C Clang 10.0.0",
        4003: "C++ GCC 9.2.1",
        4004: "C++ Clang 10.0.0",
        4005: "Java OpenJDK 11.0.6",
        4006: "Python3 CPython 3.8.2",
        4007: "Bash 5.0.11",
        4008: "bc 1.07.1",
        4009: "Awk GNU Awk 4.1.4",
        4010: "C# .NET Core 3.1.201",
        4011: "C# Mono-mcs 6.8.0.105",
        4012: "C# Mono-csc 3.5.0",
        4013: "Clojure 1.10.1.536",
        4014: "Crystal 0.33.0",
        4015: "D DMD 2.091.0",
        4016: "D GDC 9.2.1",
        4017: "D LDC 1.20.1",
        4018: "Dart 2.7.2",
        4019: "dc 1.4.1",
        4020: "Erlang 22.3",
        4021: "Elixir 1.10.2",
        4022: "F# .NET Core 3.1.201",
        4023: "F# Mono 10.2.3",
        4024: "Forth gforth 0.7.3",
        4025: "Fortran GNU Fortran 9.2.1",
        4026: "Go 1.14.1",
        4027: "Haskell GHC 8.8.3",
        4028: "Haxe 4.0.3",
        4029: "Haxe 4.0.3",
        4030: "JavaScript Node.js 12.16.1",
        4031: "Julia 1.4.0",
        4032: "Kotlin 1.3.71",
        4033: "Lua Lua 5.3.5",
        4034: "Lua LuaJIT 2.1.0",
        4035: "Dash 0.5.8",
        4036: "Nim 1.0.6",
        4037: "Objective-C Clang 10.0.0",
        4038: "Lisp SBCL 2.0.3",
        4039: "OCaml 4.10.0",
        4040: "Octave 5.2.0",
        4041: "Pascal FPC 3.0.4",
        4042: "Perl 5.26.1",
        4043: "Raku Rakudo 2020.02.1",
        4044: "PHP 7.4.4",
        4045: "Prolog SWI-Prolog 8.0.3",
        4046: "Python PyPy2 7.3.0",
        4047: "Python3 PyPy3 7.3.0",
        4048: "Racket 7.6",
        4049: "Ruby 2.7.1",
        4050: "Rust 1.42.0",
        4051: "Scala 2.13.1",
        4052: "Java OpenJDK 1.8.0",
        4053: "Scheme Gauche 0.9.9",
        4054: "ML MLton 20130715",
        4055: "Swift 5.2.1",
        4056: "Text cat 8.28",
        4057: "TypeScript 3.8",
        4058: "Basic .NET Core 3.1.101",
        4059: "Zsh 5.4.2",
        4060: "COBOL Fixed OpenCOBOL 1.1.0",
        4061: "COBOL Free OpenCOBOL 1.1.0",
        4062: "Brainfuck bf 20041219",
        4063: "Ada Ada2012 GNAT 9.2.1",
        4064: "Unlambda 2.0.0",
        4065: "Cython 0.29.16",
        4066: "Sed 4.4",
        4067: "Vim 8.2.0460",
        // newjudge-2308
        5001: "C++ 20 gcc 12.2",
        5002: "Go 1.20.6",
        5003: "C# 11.0 .NET 7.0.7",
        5004: "Kotlin 1.8.20",
        5005: "Java OpenJDK 17",
        5006: "Nim 1.6.14",
        5007: "V 0.4",
        5008: "Zig 0.10.1",
        5009: "JavaScript Node.js 18.16.1",
        5010: "JavaScript Deno 1.35.1",
        5011: "R GNU R 4.2.1",
        5012: "D DMD 2.104.0",
        5013: "D LDC 1.32.2",
        5014: "Swift 5.8.1",
        5015: "Dart 3.0.5",
        5016: "PHP 8.2.8",
        5017: "C GCC 12.2.0",
        5018: "Ruby 3.2.2",
        5019: "Crystal 1.9.1",
        5020: "Brainfuck bf 20041219",
        5021: "F# 7.0 .NET 7.0.7",
        5022: "Julia 1.9.2",
        5023: "Bash 5.2.2",
        5024: "Text cat 8.32",
        5025: "Haskell GHC 9.4.5",
        5026: "Fortran GNU Fortran 12.2",
        5027: "Lua LuaJIT 2.1.0-beta3",
        5028: "C++ 23 gcc 12.2",
        5029: "CommonLisp SBCL 2.3.6",
        5030: "COBOL Free GnuCOBOL 3.1.2",
        5031: "C++ 23 Clang 16.0.5",
        5032: "Zsh Zsh 5.9",
        5033: "SageMath SageMath 9.5",
        5034: "Sed GNU sed 4.8",
        5035: "bc bc 1.07.1",
        5036: "dc dc 1.07.1",
        5037: "Perl perl  5.34",
        5038: "AWK GNU Awk 5.0.1",
        5039: "なでしこ cnako3 3.4.20",
        5040: "Assembly x64 NASM 2.15.05",
        5041: "Pascal FPC 3.2.2",
        5042: "C# 11.0 AOT .NET 7.0.7",
        5043: "Lua Lua 5.4.6",
        5044: "Prolog SWI-Prolog 9.0.4",
        5045: "PowerShell PowerShell 7.3.1",
        5046: "Scheme Gauche 0.9.12",
        5047: "Scala 3.3.0 Scala Native 0.4.14",
        5048: "Visual Basic 16.9 .NET 7.0.7",
        5049: "Forth gforth 0.7.3",
        5050: "Clojure babashka 1.3.181",
        5051: "Erlang Erlang 26.0.2",
        5052: "TypeScript 5.1 Deno 1.35.1",
        5053: "C++ 17 gcc 12.2",
        5054: "Rust 1.70.0",
        5055: "Python3 CPython 3.11.4",
        5056: "Scala Dotty 3.3.0",
        5057: "Koka koka 2.4.0",
        5058: "TypeScript 5.1 Node.js 18.16.1",
        5059: "OCaml ocamlopt 5.0.0",
        5060: "Raku Rakudo 2023.06",
        5061: "Vim vim 9.0.0242",
        5062: "Emacs Lisp Native Compile GNU Emacs 28.2",
        5063: "Python3 Mambaforge / CPython 3.10.10",
        5064: "Clojure clojure 1.11.1",
        5065: "プロデル mono版プロデル 1.9.1182",
        5066: "ECLiPSe ECLiPSe 7.1_13",
        5067: "Nibbles literate form nibbles 1.01",
        5068: "Ada GNAT 12.2",
        5069: "jq jq 1.6",
        5070: "Cyber Cyber v0.2-Latest",
        5071: "Carp Carp 0.5.5",
        5072: "C++ 17 Clang 16.0.5",
        5073: "C++ 20 Clang 16.0.5",
        5074: "LLVM IR Clang 16.0.5",
        5075: "Emacs Lisp Byte Compile GNU Emacs 28.2",
        5076: "Factor Factor 0.98",
        5077: "D GDC 12.2",
        5078: "Python3 PyPy 3.10-v7.3.12",
        5079: "Whitespace whitespacers 1.0.0",
        5080: "><> fishr 0.1.0",
        5081: "ReasonML reason 3.9.0",
        5082: "Python Cython 0.29.34",
        5083: "Octave GNU Octave 8.2.0",
        5084: "Haxe JVM Haxe 4.3.1",
        5085: "Elixir Elixir 1.15.2",
        5086: "Mercury Mercury 22.01.6",
        5087: "Seed7 Seed7 3.2.1",
        5088: "Emacs Lisp No Compile GNU Emacs 28.2",
        5089: "Unison Unison M5b",
        5090: "COBOL GnuCOBOLFixed 3.1.2",
        // 
        6001: "><> fishr 0.1.0",
        6002: "Ada 2022 GNAT 15.2.0",
        6003: "APL GNU APL 1.9",
        6004: "Assembly MIPS O32 ABI GNU assembler 2.42",
        6005: "Assembly x64 NASM 2.16.03",
        6006: "AWK GNU awk 5.2.1",
        6007: "A interpreter af48a2a",
        6008: "Bash 5.3",
        6009: "Basic FreeBASIC 1.10.1",
        6010: "bc GNU bc 1.08.2",
        6011: "Befunge 93 TBC 1.0",
        6012: "Brainfuck Tritium 1.2.73",
        6013: "C 23 Clang Clang 21.1.0",
        6014: "C 23 GCC 14.2.0",
        6015: "C# 13.0 .NET 9.0.8",
        6016: "C# 13.0 .NET Native AOT 9.0.8",
        6017: "C++ 23 GCC 15.2.0",
        6018: "C3 0.7.5",
        6019: "Carp 0.5.5",
        6020: "cLay 20250308-1 GCC 15.2.0",
        6021: "Clojure babashka 1.12.208",
        6022: "Clojure 1.12.2",
        6023: "Clojure 1.12.2 AOT",
        6025: "Clojure 1.12.2 ClojureScript 1.12.42 Node.js 22.19.0",
        6026: "COBOL Free GnuCOBOL 3.2",
        6027: "CommonLisp SBCL 2.5.8",
        6028: "Crystal 1.17.0",
        6029: "Cyber 0.3",
        6030: "D DMD 2.111.0",
        6031: "D GDC 15.2",
        6032: "D LDC 1.41.0",
        6033: "Dart 3.9.2",
        6034: "dc 1.5.2 GNU bc 1.08.2",
        6035: "ECLiPSe 7.1_13",
        6036: "Eiffel Gobo Eiffel 22.01",
        6037: "Eiffel Liberty Eiffel 07829e3",
        6038: "Elixir 1.18.4 OTP 28.0.2",
        6039: "EmacsLisp (Native Compile) GNU Emacs 29.4",
        6040: "Emojicode 1.0 beta 2 emojicodec 1.0 beta 2",
        6041: "Erlang 28.0.2",
        6042: "F# 9.0 .NET 9.0.8",
        6043: "Factor 0.100",
        6044: "Fish 4.0.2",
        6045: "Forth gforth 0.7.3",
        6046: "Fortran2018 Flang 20.1.7",
        6047: "Fortran2023 GCC 14.2.0",
        6048: "FORTRAN77 GCC 14.2.0",
        6049: "Gleam 1.12.0 OTP 28.0.2",
        6050: "Go 1.18 gccgo 15.2.0",
        6051: "Go 1.25.1",
        6052: "Haskell GHC 9.8.4",
        6053: "Haxe JVM Haxe 4.3.7 hxjava 4.2.0",
        6054: "C++ GCC 14.2.0 IOI-Style(GNU++20)",
        6055: "ISLisp Easy-ISLisp 5.43",
        6056: "Java 24 OpenJDK 24.0.2",
        6057: "JavaScript Bun 1.2.21",
        6058: "JavaScript Deno 2.4.5",
        6059: "JavaScript Node.js 22.19.0",
        6060: "Jule 0.1.6",
        6061: "Koka 3.2.2",
        6062: "Kotlin 2.2.10",
        6063: "Kuin kuincl v.2021.8.17",
        6064: "LazyK irori v1.0.0",
        6065: "Lean 4.22.0",
        6066: "LLVMIR Clang 21.1.0",
        6067: "Lua 5.4.7",
        6068: "Lua LuaJIT 2.1.1703358377",
        6069: "Mercury 22.01.8",
        6071: "Nim Nim 1.6.20",
        6072: "Nim Nim 2.2.4",
        6073: "OCaml ocamlopt 5.3.0",
        6074: "Octave GNU Octave 10.2.0",
        6075: "Pascal FPC 3.2.2",
        6076: "Perl 5.38.2",
        6077: "PHP 8.4.12",
        6078: "Piet your-diary/piet_programming_language 3.0.0 (PPM image)",
        6079: "Pony 0.59.0",
        6080: "PowerShell 7.5.2",
        6081: "Prolog SWI-Prolog 9.2.9",
        6082: "Python3 CPython 3.13.7",
        6083: "Python3 PyPy 3.11-v7.3.20",
        6084: "R GNU R 4.5.0",
        6085: "ReasonML reson 3.16.0",
        6086: "Ruby 3.3 truffleruby 25.0.0",
        6087: "Ruby 3.4.5",
        6088: "Rust 1.89.0",
        6089: "SageMath 10.7",
        6090: "Scala 3.7.2 Dotty",
        6091: "Scala 3.7.2 Scala Native 0.5.8",
        6092: "Scheme ChezScheme 10.2.0",
        6093: "Scheme Gauche 0.9.15",
        6094: "Seed7 Seed7 3.5.0",
        6095: "Swift 6.2",
        6096: "Tcl 9.0.1",
        6097: "Terra 1.2.0",
        6098: "TeX 3.141592653",
        6099: "Text cat 9.4",
        6100: "TypeScript 5.8 Deno 2.4.5",
        6101: "TypeScript 5.9 tsc 5.9.2 Bun 1.2.21",
        6102: "TypeScript 5.9 tsc 5.9.2 Node.js 22.19.0",
        6103: "Uiua 0.16.2",
        6104: "Unison 0.5.47",
        6105: "V 0.4.10",
        6106: "Vala 0.56.18",
        6107: "Verilog 2012 Icarus Verilog 12.0",
        6108: "Veryl 0.16.4",
        6109: "WebAssembly wabt 1.0.34 + iwasm 2.4.1",
        6110: "Whitespace whitespacers 1.3.0",
        6111: "Zig 0.15.1",
        6112: "なでしこ cnako3 3.7.8 Node.js 22.19.0",
        6113: "プロデル mono版プロデル 2.0.1353",
        6114: "Julia 1.11.6",
        6115: "Python Codon 0.19.3",
        6116: "C++ 23 Clang 21.1.0",
        6117: "Fix 1.1.0-alpha.12",
        6118: "SQL DuckDB 1.3.2",
    };
    // filter langMap
    const existingLangs = new Set();
    for (const option of doc.querySelector("#select-lang select.current").options) {
        existingLangs.add(option.value);
    }
    for (const key of Object.keys(langMap)) {
        if (!existingLangs.has(key.toString())) {
            delete langMap[key];
        }
    }
    const languageId = new ObservableValue(unsafeWindow.$("#select-lang select.current").val());
    unsafeWindow.$("#select-lang select").change(() => {
        languageId.value = unsafeWindow.$("#select-lang select.current").val();
    });
    const language = languageId.map(lang => langMap[lang]);
    const isTestCasesHere = /^\/contests\/[^\/]+\/tasks\//.test(location.pathname);
    const taskSelector = doc.querySelector("#select-task");
    function getTaskURI() {
        if (taskSelector)
            return `${location.origin}/contests/${unsafeWindow.contestScreenName}/tasks/${taskSelector.value}`;
        return `${location.origin}${location.pathname}`;
    }
    const testcasesCache = {};
    if (taskSelector) {
        const doFetchTestCases = async () => {
            console.log(`Fetching test cases...: ${getTaskURI()}`);
            const taskURI = getTaskURI();
            const load = !(taskURI in testcasesCache) || testcasesCache[taskURI].state == "error";
            if (!load)
                return;
            try {
                testcasesCache[taskURI] = { state: "loading" };
                const testcases = await fetchTestCases(taskURI);
                testcasesCache[taskURI] = { testcases, state: "loaded" };
            }
            catch (e) {
                testcasesCache[taskURI] = { state: "error" };
            }
        };
        unsafeWindow.$("#select-task").change(doFetchTestCases);
        doFetchTestCases();
    }
    async function fetchTestCases(taskUrl) {
        const html = await fetch(taskUrl).then(res => res.text());
        const taskDoc = new DOMParser().parseFromString(html, "text/html");
        return getTestCases(taskDoc);
    }
    function getTestCases(doc) {
        const selectors = [
            ["#task-statement p+pre.literal-block", ".section"],
            ["#task-statement pre.source-code-for-copy", ".part"],
            ["#task-statement .lang>*:nth-child(1) .div-btn-copy+pre", ".part"],
            ["#task-statement .div-btn-copy+pre", ".part"],
            ["#task-statement>.part pre.linenums", ".part"],
            ["#task-statement>.part section>pre", ".part"],
            ["#task-statement>.part:not(.io-style)>h3+section>pre", ".part"],
            ["#task-statement pre", ".part"],
        ];
        for (const [selector, closestSelector] of selectors) {
            let e = [...doc.querySelectorAll(selector)];
            e = e.filter(e => {
                if (e.closest(".io-style"))
                    return false; // practice2
                if (e.querySelector("var"))
                    return false;
                return true;
            });
            if (e.length == 0)
                continue;
            return pairs(e).map(([input, output], index) => {
                const container = input.closest(closestSelector) || input.parentElement;
                return {
                    selector,
                    title: `Sample ${index + 1}`,
                    input: input.textContent,
                    output: output.textContent,
                    anchor: container.querySelector(".btn-copy") || container.querySelector("h1,h2,h3,h4,h5,h6"),
                };
            });
        }
        { // maximum_cup_2018_d
            let e = [...doc.querySelectorAll("#task-statement .div-btn-copy+pre")];
            e = e.filter(f => !f.childElementCount);
            if (e.length) {
                return pairs(e).map(([input, output], index) => ({
                    selector: "#task-statement .div-btn-copy+pre",
                    title: `Sample ${index + 1}`,
                    input: input.textContent,
                    output: output.textContent,
                    anchor: (input.closest(".part") || input.parentElement).querySelector(".btn-copy"),
                }));
            }
        }
        return [];
    }
    const atcoder = {
        name: "AtCoder",
        language,
        langMap,
        get sourceCode() {
            const $ = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
            if (typeof unsafeWindow["ace"] != "undefined") {
                if (!$(".btn-toggle-editor").classList.contains("active")) {
                    return unsafeWindow["ace"].edit($("#editor")).getValue();
                }
                else {
                    return $("#plain-textarea").value;
                }
            }
            else {
                return unsafeWindow.getSourceCode();
            }
        },
        set sourceCode(sourceCode) {
            const $ = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
            if (typeof unsafeWindow["ace"] != "undefined") {
                unsafeWindow["ace"].edit($("#editor")).setValue(sourceCode);
                $("#plain-textarea").value = sourceCode;
            }
            else {
                doc.querySelector(".plain-textarea").value = sourceCode;
                unsafeWindow.$(".editor").data("editor").doc.setValue(sourceCode);
            }
        },
        submit() {
            doc.querySelector("#submit").click();
        },
        get testButtonContainer() {
            return doc.querySelector("#submit").parentElement;
        },
        get sideButtonContainer() {
            return doc.querySelector(".editor-buttons");
        },
        get bottomMenuContainer() {
            return doc.getElementById("main-div");
        },
        get resultListContainer() {
            return doc.querySelector(".form-code-submit");
        },
        get testCases() {
            const taskURI = getTaskURI();
            if (taskURI in testcasesCache && testcasesCache[taskURI].state == "loaded")
                return testcasesCache[taskURI].testcases;
            if (isTestCasesHere) {
                const testcases = getTestCases(doc);
                testcasesCache[taskURI] = { testcases, state: "loaded" };
                return testcases;
            }
            else {
                console.error("AtCoder Easy Test v2: Test cases are still not loaded");
                return [];
            }
        },
        get jQuery() {
            return unsafeWindow["jQuery"];
        },
        get taskURI() {
            return getTaskURI();
        },
    };
    return atcoder;
}

async function init$4() {
    if (location.host != "yukicoder.me")
        throw "Not yukicoder";
    const doc = unsafeWindow.document;
    const editor = unsafeWindow.ace.edit("rich_source");
    const eSourceObject = doc.querySelector("#source");
    const eLang = doc.querySelector("#lang");
    const eSamples = doc.querySelectorAll(".sample");
    doc.head.appendChild(newElement("link", {
        rel: "stylesheet",
        href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    }));
    await loadScript("https://cdn.jsdelivr.net/npm/jquery@1.9.1/jquery.min.js");
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js");
    // summary タグの矢印が消える対策
    const correctionStyleSheet = new CSSStyleSheet();
    correctionStyleSheet.replaceSync(`
    summary {
      display: list-item;
    }
  `);
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, correctionStyleSheet];
    const langMap = {
        "cpp14": "C++ C++14 GCC 11.1.0 + Boost 1.77.0",
        "cpp17": "C++ C++17 GCC 11.1.0 + Boost 1.77.0",
        "cpp-clang": "C++ C++17 Clang 10.0.0 + Boost 1.76.0",
        "cpp23": "C++ C++11 GCC 8.4.1",
        "c11": "C++ C++11 GCC 11.1.0",
        "c": "C C90 GCC 8.4.1",
        "java8": "Java Java16 OpenJDK 16.0.1",
        "csharp": "C# CSC 3.9.0",
        "csharp_mono": "C# Mono 6.12.0.147",
        "csharp_dotnet": "C# .NET 5.0",
        "perl": "Perl 5.26.3",
        "raku": "Raku Rakudo v2021-07-2-g74d7ff771",
        "php": "PHP 7.2.24",
        "php7": "PHP 8.0.8",
        "python3": "Python3 3.9.6 + numpy 1.14.5 + scipy 1.1.0",
        "pypy2": "Python PyPy2 7.3.5",
        "pypy3": "Python3 PyPy3 7.3.5",
        "ruby": "Ruby 3.0.2p107",
        "d": "D DMD 2.097.1",
        "go": "Go 1.16.6",
        "haskell": "Haskell 8.10.5",
        "scala": "Scala 2.13.6",
        "nim": "Nim 1.4.8",
        "rust": "Rust 1.53.0",
        "kotlin": "Kotlin 1.5.21",
        "scheme": "Scheme Gauche 0.9.10",
        "crystal": "Crystal 1.1.1",
        "swift": "Swift 5.4.2",
        "ocaml": "OCaml 4.12.0",
        "clojure": "Clojure 1.10.2.790",
        "fsharp": "F# 5.0",
        "elixir": "Elixir 1.7.4",
        "lua": "Lua LuaJIT 2.0.5",
        "fortran": "Fortran gFortran 8.4.1",
        "node": "JavaScript Node.js 15.5.0",
        "typescript": "TypeScript 4.3.5",
        "lisp": "Lisp Common Lisp sbcl 2.1.6",
        "sml": "ML Standard ML MLton 20180207-6",
        "kuin": "Kuin KuinC++ v.2021.7.17",
        "vim": "Vim v8.2",
        "sh": "Bash 4.4.19",
        "nasm": "Assembler nasm 2.13.03",
        "clay": "cLay 20210917-1",
        "bf": "Brainfuck BFI 1.1",
        "Whitespace": "Whitespace 0.3",
        "text": "Text cat 8.3",
    };
    // place anchor elements
    for (const btnCopyInput of doc.querySelectorAll(".copy-sample-input")) {
        btnCopyInput.parentElement.insertBefore(newElement("span", { className: "atcoder-easy-test-anchor" }), btnCopyInput);
    }
    const language = new ObservableValue(langMap[eLang.value]);
    eLang.addEventListener("change", () => {
        language.value = langMap[eLang.value];
    });
    return {
        name: "yukicoder",
        language,
        get sourceCode() {
            if (eSourceObject.checkVisibility())
                return eSourceObject.value;
            return editor.getSession().getValue();
        },
        set sourceCode(sourceCode) {
            eSourceObject.value = sourceCode;
            editor.getSession().setValue(sourceCode);
        },
        submit() {
            doc.querySelector(`#submit_form input[type="submit"]`).click();
        },
        get testButtonContainer() {
            return doc.querySelector("#submit_form");
        },
        get sideButtonContainer() {
            return doc.querySelector("#toggle_source_editor").parentElement;
        },
        get bottomMenuContainer() {
            return doc.body;
        },
        get resultListContainer() {
            return doc.querySelector("#content");
        },
        get testCases() {
            const testCases = [];
            let sampleId = 1;
            for (let i = 0; i < eSamples.length; i++) {
                const eSample = eSamples[i];
                const [eInput, eOutput] = eSample.querySelectorAll("pre");
                testCases.push({
                    title: `Sample ${sampleId++}`,
                    input: eInput.textContent,
                    output: eOutput.textContent,
                    anchor: eSample.querySelector(".atcoder-easy-test-anchor"),
                });
            }
            return testCases;
        },
        get jQuery() {
            return unsafeWindow["jQuery"];
        },
        get taskURI() {
            return location.href;
        },
    };
}

class Editor {
    _element;
    constructor(lang) {
        this._element = document.createElement("textarea");
        this._element.style.fontFamily = "monospace";
        this._element.style.width = "100%";
        this._element.style.minHeight = "5em";
    }
    get element() {
        return this._element;
    }
    get sourceCode() {
        return this._element.value;
    }
    set sourceCode(sourceCode) {
        this._element.value = sourceCode;
    }
    setLanguage(lang) {
    }
}

var langMap = {
    3: "Delphi 7",
    4: "Pascal Free Pascal 3.0.2",
    6: "PHP 7.2.13",
    7: "Python 2.7.18",
    9: "C# Mono 6.8",
    12: "Haskell GHC 8.10.1",
    13: "Perl 5.20.1",
    19: "OCaml 4.02.1",
    20: "Scala 2.12.8",
    28: "D DMD32 v2.091.0",
    31: "Python3 3.8.10",
    32: "Go 1.15.6",
    34: "JavaScript V8 4.8.0",
    36: "Java 1.8.0_241",
    40: "Python PyPy2 2.7 (7.3.0)",
    41: "Python3 PyPy3 3.7 (7.3.0)",
    43: "C C11 GCC 5.1.0",
    48: "Kotlin 1.5.31",
    49: "Rust 1.49.0",
    50: "C++ C++14 G++ 6.4.0",
    51: "Pascal PascalABC.NET 3.4.1",
    52: "C++ C++17 Clang++",
    54: "C++ C++17 G++ 7.3.0",
    55: "JavaScript Node.js 12.6.3",
    59: "C++ Microsoft Visual C++ 2017",
    60: "Java 11.0.6",
    61: "C++ C++17 9.2.0 (64 bit, msys 2)",
    65: "C# 8, .NET Core 3.1",
    67: "Ruby 3.0.0",
    70: "Python3 PyPy 3.7 (7.3.5, 64bit)",
    72: "Kotlin 1.5.31",
    73: "C++ GNU G++ 11.2.0 (64 bit, winlibs)",
    75: "Rust 1.75.0 (2021)",
    79: "C# 10, .NET SDK 6.0",
    83: "Kotlin 1.7.20",
    87: "Java 21 64bit",
    88: "Kotlin 1.9.21",
    89: "C++ GNU G++20 13.2 (64 bit, winlibs)",
    91: "GNU G++23 14.2 (64 bit, msys2)",
};

config.registerFlag("site.codeforces.showEditor", true, "Show Editor in Codeforces Problem Page");
async function init$3() {
    if (location.host != "codeforces.com")
        throw "not Codeforces";
    //TODO: m1.codeforces.com, m2.codeforces.com, m3.codeforces.com に対応する
    const doc = unsafeWindow.document;
    const eLang = doc.querySelector("select[name='programTypeId']");
    doc.head.appendChild(newElement("link", {
        rel: "stylesheet",
        href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    }));
    doc.head.appendChild(newElement("style", {
        textContent: `
.atcoder-easy-test-btn-run-case {
  float: right;
  line-height: 1.1rem;
}
    `,
    }));
    const eButtons = newElement("span");
    doc.querySelector(".submitForm").appendChild(eButtons);
    await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
    const jQuery = unsafeWindow["jQuery"].noConflict();
    unsafeWindow["jQuery"] = unsafeWindow["$"];
    unsafeWindow["jQuery11"] = jQuery;
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });
    const language = new ObservableValue(langMap[eLang.value]);
    eLang.addEventListener("change", () => {
        language.value = langMap[eLang.value];
    });
    let _sourceCode = "";
    const eFile = doc.querySelector(".submitForm").elements["sourceFile"];
    eFile.addEventListener("change", async () => {
        if (eFile.files[0]) {
            _sourceCode = await eFile.files[0].text();
            if (editor)
                editor.sourceCode = _sourceCode;
        }
    });
    let editor = null;
    let waitCfFastSubmitCount = 0;
    const waitCfFastSubmit = setInterval(() => {
        if (document.getElementById("editor")) {
            // cf-fast-submit
            if (editor && editor.element)
                editor.element.style.display = "none";
            // 言語セレクトを同期させる
            const eLang2 = doc.querySelector(".submit-form select[name='programTypeId']");
            if (eLang2) {
                eLang.addEventListener("change", () => {
                    eLang2.value = eLang.value;
                });
                eLang2.addEventListener("change", () => {
                    eLang.value = eLang2.value;
                    language.value = langMap[eLang.value];
                });
            }
            // TODO: 選択されたファイルをどうかする
            // エディタを使う
            const aceEditor = unsafeWindow["ace"].edit("editor");
            editor = {
                get sourceCode() {
                    return aceEditor.getValue();
                },
                set sourceCode(sourceCode) {
                    aceEditor.setValue(sourceCode);
                },
                setLanguage(lang) { },
            };
            // ボタンを追加する
            const buttonContainer = doc.querySelector(".submit-form .submit").parentElement;
            buttonContainer.appendChild(newElement("button", {
                type: "button",
                className: "btn btn-info",
                textContent: "Test & Submit",
                onclick: () => events.trig("testAndSubmit"),
            }));
            buttonContainer.appendChild(newElement("button", {
                type: "button",
                className: "btn btn-default",
                textContent: "Test All Samples",
                onclick: () => events.trig("testAllSamples"),
            }));
            clearInterval(waitCfFastSubmit);
        }
        else {
            waitCfFastSubmitCount++;
            if (waitCfFastSubmitCount >= 100)
                clearInterval(waitCfFastSubmit);
        }
    }, 100);
    if (config.get("site.codeforces.showEditor", true)) {
        editor = new Editor(langMap[eLang.value].split(" ")[0]);
        doc.getElementById("pageContent").appendChild(editor.element);
        language.addListener(lang => {
            editor.setLanguage(lang);
        });
    }
    return {
        name: "Codeforces",
        language,
        get sourceCode() {
            if (editor)
                return editor.sourceCode;
            return _sourceCode;
        },
        set sourceCode(sourceCode) {
            const container = new DataTransfer();
            container.items.add(new File([sourceCode], "prog.txt", { type: "text/plain" }));
            const eFile = doc.querySelector(".submitForm").elements["sourceFile"];
            eFile.files = container.files;
            _sourceCode = sourceCode;
            if (editor)
                editor.sourceCode = sourceCode;
        },
        submit() {
            if (editor)
                _sourceCode = editor.sourceCode;
            this.sourceCode = _sourceCode;
            doc.querySelector(`.submitForm .submit`).click();
        },
        get testButtonContainer() {
            return eButtons;
        },
        get sideButtonContainer() {
            return eButtons;
        },
        get bottomMenuContainer() {
            return doc.body;
        },
        get resultListContainer() {
            return doc.querySelector("#pageContent");
        },
        get testCases() {
            const testcases = [];
            let num = 1;
            for (const eSampleTest of doc.querySelectorAll(".sample-test")) {
                const inputs = eSampleTest.querySelectorAll(".input pre");
                const outputs = eSampleTest.querySelectorAll(".output pre");
                const anchors = eSampleTest.querySelectorAll(".input .title .input-output-copier");
                const count = Math.min(inputs.length, outputs.length, anchors.length);
                for (let i = 0; i < count; i++) {
                    let inputText = "";
                    for (const node of inputs[i].childNodes) {
                        inputText += node.textContent;
                        if (node.nodeType == node.ELEMENT_NODE && (node.tagName == "DIV" || node.tagName == "BR")) {
                            inputText += "\n";
                        }
                    }
                    testcases.push({
                        title: `Sample ${num++}`,
                        input: inputText,
                        output: outputs[i].textContent,
                        anchor: anchors[i],
                    });
                }
            }
            return testcases;
        },
        get jQuery() {
            return jQuery;
        },
        get taskURI() {
            return location.href;
        },
    };
}

config.registerFlag("site.codeforcesMobile.showEditor", true, "Show Editor in Mobile Codeforces (m[1-3].codeforces.com) Problem Page");
async function init$2() {
    if (!/^m[1-3]\.codeforces\.com$/.test(location.host))
        throw "not Codeforces Mobile";
    const url = /\/contest\/(\d+)\/problem\/([^/]+)/.exec(location.pathname);
    const contestId = url[1];
    const problemId = url[2];
    const doc = unsafeWindow.document;
    const main = doc.querySelector("main");
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js");
    const language = new ObservableValue("");
    let submit = () => { };
    let getSourceCode = () => "";
    let setSourceCode = (_) => { };
    // make Editor
    if (config.get("site.codeforcesMobile.showEditor", true)) {
        const frame = newElement("iframe", {
            src: `/contest/${contestId}/submit`,
            style: {
                display: "none",
            },
        });
        doc.body.appendChild(frame);
        await new Promise(done => frame.onload = done);
        const fdoc = frame.contentDocument;
        const form = fdoc.querySelector("._SubmitPage_submitForm");
        form.elements["problemIndex"].value = problemId;
        form.elements["problemIndex"].readonly = true;
        form.elements["programTypeId"].addEventListener("change", function () {
            language.value = langMap[this.value];
        });
        for (const row of form.children) {
            if (row.tagName != "DIV")
                continue;
            row.classList.add("form-group");
            const control = row.querySelector("*[name]");
            if (control)
                control.classList.add("form-control");
        }
        form.parentElement.removeChild(form);
        main.appendChild(form);
        submit = () => form.submit();
        getSourceCode = () => form.elements["source"].value;
        setSourceCode = sourceCode => {
            form.elements["source"].value = sourceCode;
        };
    }
    return {
        name: "Codeforces",
        language,
        get sourceCode() {
            return getSourceCode();
        },
        set sourceCode(sourceCode) {
            setSourceCode(sourceCode);
        },
        submit,
        get testButtonContainer() {
            return main;
        },
        get sideButtonContainer() {
            return main;
        },
        get bottomMenuContainer() {
            return doc.body;
        },
        get resultListContainer() {
            return main;
        },
        get testCases() {
            const testcases = [];
            let index = 1;
            for (const container of doc.querySelectorAll(".sample-test")) {
                const input = container.querySelector(".input pre.content").textContent;
                const output = container.querySelector(".output pre.content").textContent;
                const anchor = container.querySelector(".input .title");
                testcases.push({
                    input, output, anchor,
                    title: `Sample ${index++}`,
                });
            }
            return testcases;
        },
        get jQuery() {
            return unsafeWindow["jQuery"];
        },
        get taskURI() {
            return location.href;
        },
    };
}

async function init$1() {
    if (location.host != "greasyfork.org" && !location.href.match(/433152-atcoder-easy-test-v2/))
        throw "Not about page";
    const doc = unsafeWindow.document;
    await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
    const jQuery = unsafeWindow["jQuery"];
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });
    const e = newElement("div");
    doc.getElementById("install-area").appendChild(newElement("button", {
        type: "button",
        textContent: "Open config",
        onclick: () => settings.open(),
    }));
    return {
        name: "About Page",
        language: new ObservableValue(""),
        get sourceCode() { return ""; },
        set sourceCode(sourceCode) { },
        submit() { },
        get testButtonContainer() { return e; },
        get sideButtonContainer() { return e; },
        get bottomMenuContainer() { return e; },
        get resultListContainer() { return e; },
        get testCases() { return []; },
        get jQuery() { return jQuery; },
        get taskURI() { return ""; },
    };
}

// 設定ページが開けなくなるのを避ける
const inits = [init$1()];
config.registerFlag("site.atcoder", true, "Use AtCoder Easy Test in AtCoder");
if (config.get("site.atcoder", true))
    inits.push(init$5());
config.registerFlag("site.yukicoder", true, "Use AtCoder Easy Test in yukicoder");
if (config.get("site.yukicoder", true))
    inits.push(init$4());
config.registerFlag("site.codeforces", true, "Use AtCoder Easy Test in Codeforces");
if (config.get("site.codeforces", true))
    inits.push(init$3());
config.registerFlag("site.codeforcesMobile", true, "Use AtCoder Easy Test in Codeforces Mobile (m[1-3].codeforces.com)");
if (config.get("site.codeforcesMobile", true))
    inits.push(init$2());
const site = Promise.any(inits);
site.catch(() => {
    for (const promise of inits) {
        promise.catch(console.error);
    }
});

class WandboxRunner extends CodeRunner {
    name;
    options;
    constructor(name, label, options = {}) {
        super(label, "Wandbox");
        this.name = name;
        this.options = options;
    }
    getOptions(sourceCode, input) {
        if (typeof this.options == "function")
            return this.options(sourceCode, input);
        return this.options;
    }
    run(sourceCode, input, options = {}) {
        return this.request(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
        }, Object.assign(options, this.getOptions(sourceCode, input))));
    }
    async request(body) {
        const startTime = Date.now();
        let res;
        try {
            res = await fetch("https://wandbox.org/api/compile.json", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }).then(r => r.json());
        }
        catch (error) {
            console.error(error);
            return {
                status: "IE",
                input: body.stdin,
                error: String(error),
            };
        }
        const endTime = Date.now();
        const result = {
            status: "OK",
            exitCode: String(res.status),
            execTime: endTime - startTime,
            input: body.stdin,
            output: String(res.program_output || ""),
            error: String(res.program_error || ""),
        };
        // 正常終了以外の場合
        if (res.status != 0) {
            if (res.signal) {
                result.exitCode += ` (${res.signal})`;
            }
            result.output = String(res.compiler_output || "") + String(result.output || "");
            result.error = String(res.compiler_error || "") + String(result.error || "");
            if (res.compiler_output || res.compiler_error) {
                result.status = "CE";
            }
            else {
                result.status = "RE";
            }
        }
        return result;
    }
}

class WandboxCppRunner extends WandboxRunner {
    async run(sourceCode, input, options = {}) {
        // ACL を結合する
        const ACLBase = "https://cdn.jsdelivr.net/gh/atcoder/ac-library/";
        const files = new Map();
        const includeHeader = async (source) => {
            const pattern = /^#\s*include\s*[<"]atcoder\/([^>"]+)[>"]/gm;
            const loaded = [];
            let match;
            while (match = pattern.exec(source)) {
                const file = "atcoder/" + match[1];
                if (files.has(file))
                    continue;
                files.set(file, null);
                loaded.push([file, fetch(ACLBase + file, { mode: "cors", cache: "force-cache", }).then(r => r.text())]);
            }
            const included = await Promise.all(loaded.map(async ([file, r]) => {
                const source = await r;
                files.set(file, source);
                return source;
            }));
            for (const source of included) {
                await includeHeader(source);
            }
        };
        await includeHeader(sourceCode);
        const codes = [];
        for (const [file, code] of files) {
            codes.push({ file, code, });
        }
        return await this.request(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
            codes,
        }, Object.assign(options, this.getOptions(sourceCode, input))));
    }
}

// 設定項目を定義
config.registerCount("wandboxAPI.cacheLifetime", 24 * 60 * 60 * 1000, "lifetime [ms] of Wandbox compiler list cache");
async function fetchWandboxCompilers() {
    // キャッシュが有効な場合はキャッシュを使う
    const cached = config.get("wandboxAPI.cachedCompilerList", { value: null, lastModified: -Infinity });
    if (Date.now() - cached.lastModified <= config.get("wandboxAPI.cacheLifetime", 24 * 60 * 60 * 1000)) {
        return cached.value;
    }
    // キャッシュが無効な場合は fetch
    const response = await fetch("https://wandbox.org/api/list.json");
    const compilers = await response.json();
    config.set("wandboxAPI.cachedCompilerList", { value: compilers, lastModified: Date.now() });
    config.save();
    return compilers;
}
function getOptimizationOption(compiler) {
    // Optimizationという名前のSwitchから、最適化のオプションを取得する
    return compiler.switches.find((sw) => sw["display-name"] === "Optimization")
        ?.name;
}
function toRunner(compiler) {
    const optimizationOption = getOptimizationOption(compiler);
    if (compiler.language == "C++") {
        return new WandboxCppRunner(compiler.name, compiler.language + " " + compiler.name + " + ACL", {
            "compiler-option-raw": "-I.",
            options: optimizationOption,
        });
    }
    else {
        return new WandboxRunner(compiler.name, compiler.language + " " + compiler.name, {
            options: optimizationOption,
        });
    }
}

const pattern = /^https?:\/\//;
let runners$1 = {};
const currentLocalRunners = [];
class LocalRunner extends CodeRunner {
    compilerName;
    static setRunners(_runners) {
        runners$1 = _runners;
    }
    static async update() {
        const apiURL = config.getString("codeRunner.localRunnerURL", "");
        for (const key of currentLocalRunners) {
            delete runners$1[key];
        }
        currentLocalRunners.length = 0;
        if (!apiURL) {
            // 未設定の場合は登録済みrunnerを削除し即return（例外を投げない）
            return;
        }
        if (!pattern.test(apiURL)) {
            throw "LocalRunner: invalid localRunnerURL";
        }
        try {
            const res = await fetch(apiURL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    mode: "list",
                }),
            }).then(r => r.json());
            for (const { language, compilerName, label } of res) {
                const key = `${language} ${compilerName} ${label}`;
                runners$1[key] = new LocalRunner(compilerName, label);
                currentLocalRunners.push(key);
            }
        }
        catch (e) {
            // fetch失敗したらreturn（例外を投げない）
            console.error("LocalRunner:", e);
            return;
        }
    }
    constructor(compilerName, label) {
        super(label, "Local");
        this.compilerName = compilerName;
    }
    async run(sourceCode, input, options = {}) {
        const apiURL = config.getString("codeRunner.localRunnerURL", "");
        if (!pattern.test(apiURL)) {
            throw "LocalRunner: invalid localRunnerURL";
        }
        let res;
        try {
            res = await fetch(apiURL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    mode: "run",
                    compilerName: this.compilerName,
                    sourceCode,
                    stdin: input,
                }),
            }).then(r => r.json());
        }
        catch (error) {
            return {
                status: "IE",
                input,
                error: String(error),
            };
        }
        const result = {
            status: "OK",
            exitCode: String(res.exitCode),
            execTime: +res.time,
            memory: +res.memory,
            input,
            output: res.stdout ?? "",
            error: res.stderr ?? "",
        };
        switch (res.status) {
            case "success": {
                if (res.exitCode == 0) {
                    result.status = "OK";
                }
                else {
                    result.status = "RE";
                }
                break;
            }
            case "compileError": {
                result.status = "CE";
                break;
            }
            case "internalError":
            default: {
                result.status = "IE";
            }
        }
        return result;
    }
}

// runners[key] = runner; key = language + " " + environmentInfo
const runners = {
    "C C17 Clang paiza.io": new PaizaIORunner("c", "C (C17 / Clang)"),
    "Python3 CPython paiza.io": new PaizaIORunner("python3", "Python3"),
    "Python3 Pyodide": pyodideRunner,
    "Bash paiza.io": new PaizaIORunner("bash", "Bash"),
    "Clojure paiza.io": new PaizaIORunner("clojure", "Clojure"),
    "D LDC paiza.io": new PaizaIORunner("d", "D (LDC)"),
    "Erlang paiza.io": new PaizaIORunner("erlang", "Erlang"),
    "Elixir paiza.io": new PaizaIORunner("elixir", "Elixir"),
    "F# Interactive paiza.io": new PaizaIORunner("fsharp", "F# (Interactive)"),
    "Haskell paiza.io": new PaizaIORunner("haskell", "Haskell"),
    "JavaScript paiza.io": new PaizaIORunner("javascript", "JavaScript"),
    "Kotlin paiza.io": new PaizaIORunner("kotlin", "Kotlin"),
    "Objective-C paiza.io": new PaizaIORunner("objective-c", "Objective-C"),
    "Perl paiza.io": new PaizaIORunner("perl", "Perl"),
    "PHP paiza.io": new PaizaIORunner("php", "PHP"),
    "Ruby paiza.io": new PaizaIORunner("ruby", "Ruby"),
    "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
    "Rust paiza.io": new PaizaIORunner("rust", "Rust"),
    "Scala paiza": new PaizaIORunner("scala", "Scala"),
    "Scheme paiza.io": new PaizaIORunner("scheme", "Scheme"),
    "Swift paiza.io": new PaizaIORunner("swift", "Swift"),
    "Text local": new CustomRunner("Text", async (sourceCode, input) => {
        return {
            status: "OK",
            exitCode: "0",
            input,
            output: sourceCode,
        };
    }),
    "Basic Visual Basic paiza.io": new PaizaIORunner("vb", "Visual Basic"),
    "COBOL Free paiza.io": new PaizaIORunner("cobol", "COBOL - Free"),
    "COBOL Fixed OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4060", "COBOL - Fixed (OpenCOBOL 1.1.0)"),
    "COBOL Free OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4061", "COBOL - Free (OpenCOBOL 1.1.0)"),
};
// wandboxの環境を追加
const wandboxPromise = fetchWandboxCompilers().then((compilers) => {
    for (const compiler of compilers) {
        let language = compiler.language;
        if (compiler.language === "Python" && /python-3\./.test(compiler.version)) {
            language = "Python3";
        }
        const key = language + " " + compiler.name;
        runners[key] = toRunner(compiler);
        console.log("wandbox", key, runners[key]);
    }
});
site.then(site => {
    if (site.name == "AtCoder") {
        // AtCoderRunner がない場合は、追加する
        for (const [languageId, descriptor] of Object.entries(site.langMap)) {
            const m = descriptor.match(/([^ ]+)(.*)/);
            if (m) {
                const name = `${m[1]} ${m[2].slice(1)} AtCoder`;
                runners[name] = new AtCoderRunner(languageId, descriptor);
            }
        }
    }
});
// LocalRunner 関連
config.registerText("codeRunner.localRunnerURL", "", "URL of Local Runner API (cf. https://github.com/magurofly/atcoder-easy-test/blob/main/v2/docs/LocalRunner.md)"); //TODO: add cf.
LocalRunner.setRunners(runners);
const localRunnerPromise = LocalRunner.update();
console.info("AtCoder Easy Test: codeRunner OK");
config.registerCount("codeRunner.maxRetry", 3, "Max count of retry when IE (Internal Error)");
var codeRunner = {
    // 指定した環境でコードを実行する
    async run(runnerId, sourceCode, input, expectedOutput, options = { trim: true, split: true }) {
        // CodeRunner が存在しない言語ID
        if (!(runnerId in runners))
            return Promise.reject("Language not supported");
        // 最後に実行したコードを保存
        if (sourceCode.length > 0)
            site.then(site => codeSaver.save(site.taskURI, sourceCode));
        // 実行
        const maxRetry = config.get("codeRunner.maxRetry", 3);
        for (let retry = 0; retry < maxRetry; retry++) {
            try {
                const result = await runners[runnerId].test(sourceCode, input, expectedOutput, options);
                const lang = runnerId.split(" ")[0];
                if (result.status == "IE") {
                    console.error(result);
                    const runnerIds = Object.keys(runners).filter(runnerId => runnerId.split(" ")[0] == lang);
                    const index = runnerIds.indexOf(runnerId);
                    runnerId = runnerIds[(index + 1) % runnerIds.length];
                    continue;
                }
                return result;
            }
            catch (e) {
                console.error(e);
            }
        }
    },
    // 環境の名前の一覧を取得する
    // @return runnerIdとラベルのペアの配列
    async getEnvironment(languageId) {
        await wandboxPromise; // wandboxAPI がコンパイラ情報を取ってくるのを待つ
        await localRunnerPromise; // LocalRunner がコンパイラ情報を取ってくるのを待つ
        const langs = similarLangs(languageId, Object.keys(runners));
        if (langs.length == 0)
            throw `Undefined language: ${languageId}`;
        return langs.map(runnerId => [runnerId, runners[runnerId].label]);
    },
};

var hBottomMenu = "<div id=\"bottom-menu-wrapper\" class=\"navbar navbar-default navbar-fixed-bottom\">\n  <div class=\"container\">\n    <div class=\"navbar-header\">\n      <button id=\"bottom-menu-key\" type=\"button\" class=\"navbar-toggle collapsed glyphicon glyphicon-menu-down\" data-toggle=\"collapse\" data-target=\"#bottom-menu\"></button>\n    </div>\n    <div id=\"bottom-menu\" class=\"collapse navbar-collapse\">\n      <ul id=\"bottom-menu-tabs\" class=\"nav nav-tabs\"></ul>\n      <div id=\"bottom-menu-contents\" class=\"tab-content\"></div>\n    </div>\n  </div>\n</div>";

var hStyle$1 = "<style>\n#bottom-menu-wrapper {\n  background: transparent !important;\n  border: none !important;\n  pointer-events: none;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container>.navbar-header {\n  float: none;\n}\n\n#bottom-menu-key {\n  display: block;\n  float: none;\n  margin: 0 auto;\n  padding: 10px 3em;\n  border-radius: 5px 5px 0 0;\n  background: #000;\n  opacity: 0.5;\n  color: #FFF;\n  cursor: pointer;\n  pointer-events: auto;\n  text-align: center;\n}\n\n@media screen and (max-width: 767px) {\n  #bottom-menu-key {\n    opacity: 0.25;\n  }\n}\n\n#bottom-menu-key.collapsed:before {\n  content: \"\\e260\";\n}\n\n#bottom-menu-tabs {\n  padding: 3px 0 0 10px;\n  cursor: n-resize;\n}\n\n#bottom-menu-tabs a {\n  pointer-events: auto;\n}\n\n#bottom-menu {\n  pointer-events: auto;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  max-height: unset;\n}\n\n#bottom-menu.collapse:not(.in) {\n  display: none !important;\n}\n\n#bottom-menu-tabs>li>a {\n  background: rgba(150, 150, 150, 0.5);\n  color: #000;\n  border: solid 1px #ccc;\n  filter: brightness(0.75);\n}\n\n#bottom-menu-tabs>li>a:hover {\n  background: rgba(150, 150, 150, 0.5);\n  border: solid 1px #ccc;\n  color: #111;\n  filter: brightness(0.9);\n}\n\n#bottom-menu-tabs>li.active>a {\n  background: #eee;\n  border: solid 1px #ccc;\n  color: #333;\n  filter: none;\n}\n\n.bottom-menu-btn-close {\n  font-size: 8pt;\n  vertical-align: baseline;\n  padding: 0 0 0 6px;\n  margin-right: -6px;\n}\n\n#bottom-menu-contents {\n  padding: 5px 15px;\n  max-height: 50vh;\n  overflow-y: auto;\n}\n\n#bottom-menu-contents .panel {\n  color: #333;\n}\n</style>";

async function init() {
    const site$1 = await site;
    const style = html2element(hStyle$1);
    const bottomMenu = html2element(hBottomMenu);
    unsafeWindow.document.head.appendChild(style);
    site$1.bottomMenuContainer.appendChild(bottomMenu);
    const bottomMenuKey = bottomMenu.querySelector("#bottom-menu-key");
    const bottomMenuTabs = bottomMenu.querySelector("#bottom-menu-tabs");
    const bottomMenuContents = bottomMenu.querySelector("#bottom-menu-contents");
    // メニューのリサイズ
    {
        let resizeStart = null;
        const onStart = (event) => {
            const target = event.target;
            const pageY = event.pageY;
            if (target.id != "bottom-menu-tabs")
                return;
            resizeStart = { y: pageY, height: bottomMenuContents.getBoundingClientRect().height };
        };
        const onMove = (event) => {
            if (!resizeStart)
                return;
            event.preventDefault();
            bottomMenuContents.style.height = `${resizeStart.height - (event.pageY - resizeStart.y)}px`;
        };
        const onEnd = () => {
            resizeStart = null;
        };
        bottomMenuTabs.addEventListener("mousedown", onStart);
        bottomMenuTabs.addEventListener("mousemove", onMove);
        bottomMenuTabs.addEventListener("mouseup", onEnd);
        bottomMenuTabs.addEventListener("mouseleave", onEnd);
    }
    let tabs = new Set();
    let selectedTab = null;
    /** 下メニューの操作
     * 下メニューはいくつかのタブからなる。タブはそれぞれ tabId, ラベル, 中身を持っている。
     */
    const menuController = {
        /** タブを選択 */
        selectTab(tabId) {
            const tab = site$1.jQuery(`#bottom-menu-tab-${tabId}`);
            if (tab && tab[0]) {
                tab.tab("show"); // Bootstrap 3
                selectedTab = tabId;
            }
        },
        /** 下メニューにタブを追加する */
        addTab(tabId, tabLabel, paneContent, options = {}) {
            console.log(`AtCoder Easy Test: addTab: ${tabLabel} (${tabId})`, paneContent);
            // タブを追加
            const tab = document.createElement("a");
            tab.textContent = tabLabel;
            tab.id = `bottom-menu-tab-${tabId}`;
            tab.href = "#";
            tab.dataset.id = tabId;
            tab.dataset.target = `#bottom-menu-pane-${tabId}`;
            tab.dataset.toggle = "tab";
            tab.addEventListener("click", event => {
                event.preventDefault();
                menuController.selectTab(tabId);
            });
            tabs.add(tab);
            const tabLi = document.createElement("li");
            tabLi.appendChild(tab);
            bottomMenuTabs.appendChild(tabLi);
            // 内容を追加
            const pane = document.createElement("div");
            pane.className = "tab-pane";
            pane.id = `bottom-menu-pane-${tabId}`;
            pane.appendChild(paneContent);
            bottomMenuContents.appendChild(pane);
            const controller = {
                get id() {
                    return tabId;
                },
                close() {
                    bottomMenuTabs.removeChild(tabLi);
                    bottomMenuContents.removeChild(pane);
                    tabs.delete(tab);
                    if (selectedTab == tabId) {
                        selectedTab = null;
                        if (tabs.size > 0) {
                            menuController.selectTab(tabs.values().next().value.dataset.id);
                        }
                    }
                },
                show() {
                    menuController.show();
                    menuController.selectTab(tabId);
                },
                set color(color) {
                    tab.style.backgroundColor = color;
                },
            };
            // 閉じるボタン
            if (options.closeButton) {
                const btn = document.createElement("a");
                btn.className = "bottom-menu-btn-close btn btn-link glyphicon glyphicon-remove";
                btn.addEventListener("click", () => {
                    controller.close();
                });
                tab.appendChild(btn);
            }
            // 選択されているタブがなければ選択
            if (!selectedTab)
                menuController.selectTab(tabId);
            return controller;
        },
        /** 下メニューを表示する */
        show() {
            if (bottomMenuKey.classList.contains("collapsed"))
                bottomMenuKey.click();
        },
        /** 下メニューの表示/非表示を切り替える */
        toggle() {
            bottomMenuKey.click();
        },
    };
    console.info("AtCoder Easy Test: bottomMenu OK");
    return menuController;
}

var hRowTemplate = "<div class=\"atcoder-easy-test-cases-row alert alert-dismissible\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">\n    <span aria-hidden=\"true\">×</span>\n  </button>\n  <div class=\"progress\">\n    <div class=\"progress-bar\" style=\"width: 0%;\">0 / 0</div>\n  </div>\n  <div class=\"atcoder-easy-test-cases-row-date\" style=\"font-family: monospace; text-align: right; position: absolute; right: 1em;\"></div>\n</div>";

class ResultRow {
    _tabs;
    _element;
    _promise;
    constructor(pairs) {
        this._tabs = pairs.map(([_, tab]) => tab);
        this._element = html2element(hRowTemplate);
        this._element.querySelector(".close").addEventListener("click", () => this.remove());
        {
            const date = new Date();
            const h = date.getHours().toString().padStart(2, "0");
            const m = date.getMinutes().toString().padStart(2, "0");
            const s = date.getSeconds().toString().padStart(2, "0");
            this._element.querySelector(".atcoder-easy-test-cases-row-date").textContent = `${h}:${m}:${s}`;
        }
        const numCases = pairs.length;
        let numFinished = 0;
        let numAccepted = 0;
        const progressBar = this._element.querySelector(".progress-bar");
        progressBar.textContent = `${numFinished} / ${numCases}`;
        this._promise = Promise.all(pairs.map(([pResult, tab]) => {
            const button = html2element(`<div class="label label-default" style="margin: 3px; cursor: pointer;">WJ</div>`);
            button.addEventListener("click", async () => {
                (await tab).show();
            });
            this._element.appendChild(button);
            return pResult.then(result => {
                button.textContent = result.status;
                if (result.status == "AC") {
                    button.classList.add("label-success");
                }
                else if (result.status != "OK") {
                    button.classList.add("label-warning");
                }
                numFinished++;
                if (result.status == "AC")
                    numAccepted++;
                progressBar.textContent = `${numFinished} / ${numCases}`;
                progressBar.style.width = `${100 * numFinished / numCases}%`;
                if (numFinished == numCases) {
                    if (numAccepted == numCases)
                        this._element.classList.add("alert-success");
                    else
                        this._element.classList.add("alert-warning");
                }
            }).catch(reason => {
                button.textContent = "IE";
                button.classList.add("label-danger");
                console.error(reason);
            });
        }));
    }
    get element() {
        return this._element;
    }
    onFinish(listener) {
        this._promise.then(listener);
    }
    remove() {
        for (const pTab of this._tabs)
            pTab.then(tab => tab.close());
        const parent = this._element.parentElement;
        if (parent)
            parent.removeChild(this._element);
    }
}

var hResultList = "<div class=\"row\"></div>";

const eResultList = html2element(hResultList);
site.then(site => site.resultListContainer.appendChild(eResultList));
const resultList = {
    addResult(pairs) {
        const result = new ResultRow(pairs);
        eResultList.insertBefore(result.element, eResultList.firstChild);
        return result;
    },
};

const version = {
    currentProperty: new ObservableValue("2.15.3"),
    get current() {
        return this.currentProperty.value;
    },
    latestProperty: new ObservableValue(config.get("version.latest", "2.15.3")),
    get latest() {
        return this.latestProperty.value;
    },
    lastCheckProperty: new ObservableValue(config.get("version.lastCheck", 0)),
    get lastCheck() {
        return this.lastCheckProperty.value;
    },
    get hasUpdate() {
        return this.compare(this.current, this.latest) < 0;
    },
    compare(a, b) {
        const x = a.split(".").map((s) => parseInt(s, 10));
        const y = b.split(".").map((s) => parseInt(s, 10));
        for (let i = 0; i < 3; i++) {
            if (x[i] < y[i]) {
                return -1;
            }
            else if (x[i] > y[i]) {
                return 1;
            }
        }
        return 0;
    },
    async checkUpdate(force = false) {
        const now = Date.now();
        if (!force && now - version.lastCheck < config.get("version.checkInterval", aDay)) {
            return this.current;
        }
        const packageJson = await fetch("https://raw.githubusercontent.com/magurofly/atcoder-easy-test/main/v2/package.json").then(r => r.json());
        console.log(packageJson);
        const latest = packageJson["version"];
        this.latestProperty.value = latest;
        config.set("version.latest", latest);
        this.lastCheckProperty.value = now;
        config.set("version.lastCheck", now);
        return latest;
    },
};
// 更新チェック
const aDay = 24 * 60 * 60 * 1e3;
config.registerCount("version.checkInterval", aDay, "Interval [ms] of checking for new version");
config.get("version.checkInterval", aDay);
setInterval(() => {
    version.checkUpdate(false);
}, 60e3);
settings.add("version", (win) => {
    const root = newElement("div");
    const text = win.document.createTextNode.bind(win.document);
    const textAuto = (property) => {
        const t = text(property.value);
        property.addListener(value => {
            t.textContent = value;
        });
        return t;
    };
    const tCurrent = textAuto(version.currentProperty);
    const tLatest = textAuto(version.latestProperty);
    const tLastCheck = textAuto(version.lastCheckProperty.map(time => new Date(time).toLocaleString()));
    root.appendChild(newElement("p", {}, [
        text("AtCoder Easy Test v"),
        tCurrent,
    ]));
    const updateButton = newElement("a", {
        className: "btn btn-info",
        textContent: "Install",
        href: "https://github.com/magurofly/atcoder-easy-test/raw/main/v2/atcoder-easy-test.user.js",
        target: "_blank",
    });
    const showButton = () => {
        if (version.hasUpdate)
            updateButton.style.display = "inline";
        else
            updateButton.style.display = "none";
    };
    showButton();
    version.lastCheckProperty.addListener(showButton);
    root.appendChild(newElement("p", {}, [
        text("Latest: v"),
        tLatest,
        text(" (Last Check: "),
        tLastCheck,
        text(") "),
        updateButton,
    ]));
    root.appendChild(newElement("p", {}, [
        newElement("a", {
            className: "btn btn-primary",
            textContent: "Check Update",
            onclick() {
                version.checkUpdate(true);
            },
        }),
    ]));
    return root;
});

var hTabTemplate = "<div class=\"atcoder-easy-test-result container\">\n  <div class=\"row\">\n    <div class=\"atcoder-easy-test-result-col-input col-xs-12\" data-if-expected-output=\"col-sm-6 col-sm-push-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Input\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-input form-control\" rows=\"3\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n    <div class=\"atcoder-easy-test-result-col-expected-output col-xs-12 col-sm-6 hidden\" data-if-expected-output=\"!hidden col-sm-pull-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Expected Output\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-expected-output form-control\" rows=\"3\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n  </div>\n  <div class=\"row\"><div class=\"col-sm-6 col-sm-offset-3\">\n    <div class=\"panel panel-default\">\n      <table class=\"table table-condensed\">\n        <tbody>\n          <tr>\n            <th class=\"text-center\">Exit Code</th>\n            <th class=\"text-center\">Exec Time</th>\n            <th class=\"text-center\">Memory</th>\n          </tr>\n          <tr>\n            <td class=\"atcoder-easy-test-result-exit-code text-center\"></td>\n            <td class=\"atcoder-easy-test-result-exec-time text-center\"></td>\n            <td class=\"atcoder-easy-test-result-memory text-center\"></td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div></div>\n  <div class=\"row\">\n    <div class=\"atcoder-easy-test-result-col-output col-xs-12\" data-if-error=\"col-md-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Output\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-output form-control\" rows=\"5\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n    <div class=\"atcoder-easy-test-result-col-error col-xs-12 col-md-6 hidden\" data-if-error=\"!hidden\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Error\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-error form-control\" rows=\"5\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n  </div>\n</div>";

function setClassFromData(element, name) {
    const classes = element.dataset[name].split(/\s+/);
    for (let className of classes) {
        let flag = true;
        if (className[0] == "!") {
            className = className.slice(1);
            flag = false;
        }
        element.classList.toggle(className, flag);
    }
}
class ResultTabContent {
    _title;
    _uid;
    _element;
    _result;
    constructor() {
        this._uid = Date.now().toString(16) + Math.floor(Math.random() * 256).toString(16);
        this._result = null;
        this._element = html2element(hTabTemplate);
        this._element.id = `atcoder-easy-test-result-${this._uid}`;
    }
    set result(result) {
        this._result = result;
        if (result.status == "AC") {
            this.outputStyle.backgroundColor = "#dff0d8";
        }
        else if (result.status != "OK") {
            this.outputStyle.backgroundColor = "#fcf8e3";
        }
        this.input = result.input;
        if ("expectedOutput" in result)
            this.expectedOutput = result.expectedOutput;
        this.exitCode = result.exitCode;
        if ("execTime" in result)
            this.execTime = `${result.execTime} ms`;
        if ("memory" in result)
            this.memory = `${result.memory} KB`;
        if ("output" in result)
            this.output = result.output;
        if (result.error)
            this.error = result.error;
    }
    get result() {
        return this._result;
    }
    get uid() {
        return this._uid;
    }
    get element() {
        return this._element;
    }
    set title(title) {
        this._title = title;
    }
    get title() {
        return this._title;
    }
    set input(input) {
        this._get("input").value = input;
    }
    get inputStyle() {
        return this._get("input").style;
    }
    set expectedOutput(output) {
        this._get("expected-output").value = output;
        setClassFromData(this._get("col-input"), "ifExpectedOutput");
        setClassFromData(this._get("col-expected-output"), "ifExpectedOutput");
    }
    get expectedOutputStyle() {
        return this._get("expected-output").style;
    }
    set output(output) {
        this._get("output").value = output;
    }
    get outputStyle() {
        return this._get("output").style;
    }
    set error(error) {
        this._get("error").value = error;
        setClassFromData(this._get("col-output"), "ifError");
        setClassFromData(this._get("col-error"), "ifError");
    }
    set exitCode(code) {
        const element = this._get("exit-code");
        element.textContent = code;
        const isSuccess = code == "0";
        element.classList.toggle("bg-success", isSuccess);
        element.classList.toggle("bg-danger", !isSuccess);
    }
    set execTime(time) {
        this._get("exec-time").textContent = time;
    }
    set memory(memory) {
        this._get("memory").textContent = memory;
    }
    _get(name) {
        return this._element.querySelector(`.atcoder-easy-test-result-${name}`);
    }
}

var hRoot = "<form id=\"atcoder-easy-test-container\" class=\"form-horizontal\">\n  <div class=\"row\">\n      <div class=\"col-xs-12 col-lg-8\">\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\">Test Environment</label>\n              <div class=\"col-sm-10\">\n                  <select class=\"form-control\" id=\"atcoder-easy-test-language\" style=\"width: 100% !important\"></select>\n              </div>\n          </div>\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-input\">Standard Input</label>\n              <div class=\"col-sm-10\">\n                  <textarea id=\"atcoder-easy-test-input\" name=\"input\" class=\"form-control\" rows=\"3\"></textarea>\n              </div>\n          </div>\n      </div>\n      <div class=\"col-xs-12 col-lg-4\">\n          <details close>\n              <summary>Expected Output</summary>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-allowable-error-check\">Allowable Error</label>\n                  <div class=\"col-sm-10\">\n                      <div class=\"input-group\">\n                          <span class=\"input-group-addon\">\n                              <input id=\"atcoder-easy-test-allowable-error-check\" type=\"checkbox\" checked=\"checked\">\n                          </span>\n                          <input id=\"atcoder-easy-test-allowable-error\" type=\"text\" class=\"form-control\" value=\"1e-6\">\n                      </div>\n                  </div>\n              </div>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-output\">Expected Output</label>\n                  <div class=\"col-sm-10\">\n                      <textarea id=\"atcoder-easy-test-output\" name=\"output\" class=\"form-control\" rows=\"3\"></textarea>\n                  </div>\n              </div>\n          </details>\n      </div>\n      <div class=\"col-xs-12 col-md-6\">\n          <div class=\"col-xs-11 col-xs-offset=1\">\n              <div class=\"form-group\">\n                  <a id=\"atcoder-easy-test-run\" class=\"btn btn-primary\">Run</a>\n              </div>\n          </div>\n      </div>\n      <div class=\"col-xs-12 col-md-6\">\n          <div class=\"col-xs-11 col-xs-offset=1\">\n              <div class=\"form-group text-right\">\n                  <small>AtCoder Easy Test v<span id=\"atcoder-easy-test-version\"></span></small>\n                  <a id=\"atcoder-easy-test-setting\" class=\"btn btn-xs btn-default\">Setting</a>\n              </div>\n          </div>\n      </div>\n  </div>\n  <style>\n  #atcoder-easy-test-language {\n      border: none;\n      background: transparent;\n      font: inherit;\n      color: #fff;\n  }\n  #atcoder-easy-test-language option {\n      border: none;\n      color: #333;\n      font: inherit;\n  }\n  </style>\n</form>";

var hStyle = "<style>\n.atcoder-easy-test-result textarea {\n  font-family: monospace;\n  font-weight: normal;\n}\n</style>";

var hRunButton = "<button type=\"button\" class=\"btn btn-primary btn-sm atcoder-easy-test-btn-run-case\" style=\"vertical-align: top; margin-left: 0.5em\">Run</button>";

var hTestAndSubmit = "<button type=\"button\" id=\"atcoder-easy-test-btn-test-and-submit\" class=\"btn btn-info btn\" style=\"margin-left: 1rem\" title=\"Ctrl+Enter\" data-toggle=\"tooltip\">Test &amp; Submit</button>";

var hTestAllSamples = "<button type=\"button\" id=\"atcoder-easy-test-btn-test-all\" class=\"btn btn-default btn-sm\" style=\"margin-left: 1rem\" title=\"Alt+Enter\" data-toggle=\"tooltip\">Test All Samples</button>";

(async () => {
    const site$1 = await site;
    const doc = unsafeWindow.document;
    // init bottomMenu
    const pBottomMenu = init();
    pBottomMenu.then(bottomMenu => {
        unsafeWindow.bottomMenu = bottomMenu;
    });
    await doneOrFail(pBottomMenu);
    // external interfaces
    unsafeWindow.codeRunner = codeRunner;
    doc.head.appendChild(html2element(hStyle));
    // interface
    const atCoderEasyTest = {
        version,
        site: site$1,
        config,
        codeSaver,
        enableButtons() {
            events.trig("enable");
        },
        disableButtons() {
            events.trig("disable");
        },
        runCount: 0,
        runTest(title, language, sourceCode, input, output = null, options = { trim: true, split: true, }) {
            this.disableButtons();
            const content = new ResultTabContent();
            const pTab = pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test-result-" + content.uid, `#${++this.runCount} ${title}`, content.element, { active: true, closeButton: true }));
            const pResult = codeRunner.run(language, sourceCode, input, output, options);
            pResult.then(result => {
                content.result = result;
                if (result.status == "AC") {
                    pTab.then(tab => tab.color = "#dff0d8");
                }
                else if (result.status != "OK") {
                    pTab.then(tab => tab.color = "#fcf8e3");
                }
            }).finally(() => {
                this.enableButtons();
            });
            return [pResult, pTab];
        }
    };
    unsafeWindow.atCoderEasyTest = atCoderEasyTest;
    // place "Easy Test" tab
    {
        // declare const hRoot: string;
        const root = html2element(hRoot);
        const E = (id) => root.querySelector(`#atcoder-easy-test-${id}`);
        const eLanguage = E("language");
        const eInput = E("input");
        const eAllowableErrorCheck = E("allowable-error-check");
        const eAllowableError = E("allowable-error");
        const eOutput = E("output");
        const eRun = E("run");
        const eSetting = E("setting");
        const eVersion = E("version");
        eVersion.textContent = atCoderEasyTest.version.current;
        events.on("enable", () => {
            eRun.classList.remove("disabled");
        });
        events.on("disable", () => {
            eRun.classList.add("disabled");
        });
        eSetting.addEventListener("click", () => {
            settings.open();
        });
        // バージョン確認
        {
            let button = null;
            const showButton = () => {
                if (!version.hasUpdate)
                    return;
                if (button) {
                    button.textContent = `Update to v${version.latest}`;
                    return;
                }
                console.info(`AtCoder Easy Test: New version available: v${version}`);
                button = newElement("a", {
                    href: "https://github.com/magurofly/atcoder-easy-test/raw/main/v2/atcoder-easy-test.user.js",
                    target: "_blank",
                    className: "btn btn-xs btn-info",
                    textContent: `Update to v${version.latest}`,
                });
                eVersion.insertAdjacentElement("afterend", button);
            };
            version.latestProperty.addListener(showButton);
            showButton();
        }
        // 言語選択関係
        {
            async function onEnvChange() {
                const langSelection = config.get("langSelection", {});
                langSelection[site$1.language.value] = eLanguage.value;
                config.set("langSelection", langSelection);
                config.save();
            }
            if (unsafeWindow["jQuery"] && unsafeWindow["jQuery"].fn.select2) {
                unsafeWindow["jQuery"](eLanguage).on("change", onEnvChange);
            }
            else {
                eLanguage.addEventListener("change", onEnvChange);
            }
            async function setLanguage() {
                const languageId = site$1.language.value;
                while (eLanguage.firstChild)
                    eLanguage.removeChild(eLanguage.firstChild);
                try {
                    if (!languageId)
                        throw new Error("AtCoder Easy Test: language not set");
                    const langs = await codeRunner.getEnvironment(languageId);
                    console.log(`AtCoder Easy Test: language = ${langs[1]} (${langs[0]})`);
                    // add <option>
                    for (const [languageId, label] of langs) {
                        const option = document.createElement("option");
                        option.value = languageId;
                        option.textContent = label;
                        eLanguage.appendChild(option);
                    }
                    // load
                    const langSelection = config.get("langSelection", {});
                    if (languageId in langSelection) {
                        const prev = langSelection[languageId];
                        if (langs.some(([lang, _]) => lang == prev)) {
                            eLanguage.value = prev;
                        }
                    }
                    events.trig("enable");
                }
                catch (error) {
                    console.log(`AtCoder Easy Test: language = ? (${languageId})`);
                    console.error(error);
                    const option = document.createElement("option");
                    option.className = "fg-danger";
                    option.textContent = error;
                    eLanguage.appendChild(option);
                    events.trig("disable");
                }
            }
            site$1.language.addListener(() => setLanguage());
            eAllowableError.disabled = !eAllowableErrorCheck.checked;
            eAllowableErrorCheck.addEventListener("change", event => {
                eAllowableError.disabled = !eAllowableErrorCheck.checked;
            });
        }
        // テスト実行
        function runTest(title, input, output = null, options = {}) {
            const opts = Object.assign({ trim: true, split: true, }, options);
            if (eAllowableErrorCheck.checked) {
                opts.allowableError = parseFloat(eAllowableError.value);
            }
            return atCoderEasyTest.runTest(title, eLanguage.value, site$1.sourceCode, input, output, opts);
        }
        function runAllCases(testcases) {
            const runGroupId = uuid();
            const pairs = testcases.map(testcase => runTest(testcase.title, testcase.input, testcase.output, { runGroupId }));
            resultList.addResult(pairs);
            return Promise.all(pairs.map(([pResult, _]) => pResult.then(result => {
                if (result.status == "AC")
                    return Promise.resolve(result);
                else
                    return Promise.reject(result);
            })));
        }
        eRun.addEventListener("click", _ => {
            const title = "Run";
            const input = eInput.value;
            const output = eOutput.value;
            runTest(title, input, output || null);
        });
        await doneOrFail(pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test", "Easy Test", root)));
        // place "Run" button on each sample
        for (const testCase of site$1.testCases) {
            const eRunButton = html2element(hRunButton);
            eRunButton.addEventListener("click", async () => {
                const [pResult, pTab] = runTest(testCase.title, testCase.input, testCase.output);
                await pResult;
                (await pTab).show();
            });
            testCase.anchor.insertAdjacentElement("afterend", eRunButton);
            events.on("disable", () => {
                eRunButton.classList.add("disabled");
            });
            events.on("enable", () => {
                eRunButton.classList.remove("disabled");
            });
        }
        // place "Test & Submit" button
        {
            const button = html2element(hTestAndSubmit);
            site$1.testButtonContainer.appendChild(button);
            const testAndSubmit = async () => {
                await runAllCases(site$1.testCases);
                site$1.submit();
            };
            button.addEventListener("click", testAndSubmit);
            events.on("testAndSubmit", testAndSubmit);
            events.on("disable", () => button.classList.add("disabled"));
            events.on("enable", () => button.classList.remove("disabled"));
        }
        // place "Test All Samples" button
        {
            const button = html2element(hTestAllSamples);
            site$1.testButtonContainer.appendChild(button);
            const testAllSamples = () => runAllCases(site$1.testCases);
            button.addEventListener("click", testAllSamples);
            events.on("testAllSamples", testAllSamples);
            events.on("disable", () => button.classList.add("disabled"));
            events.on("enable", () => button.classList.remove("disabled"));
        }
    }
    // place "Restore Last Play" button
    try {
        const restoreButton = doc.createElement("a");
        restoreButton.className = "btn btn-danger btn-sm";
        restoreButton.textContent = "Restore Last Play";
        restoreButton.addEventListener("click", async () => {
            try {
                const lastCode = await codeSaver.restore(site$1.taskURI);
                if (site$1.sourceCode.length == 0 || confirm("Your current code will be replaced. Are you sure?")) {
                    site$1.sourceCode = lastCode;
                }
            }
            catch (reason) {
                alert(reason);
            }
        });
        site$1.sideButtonContainer.appendChild(restoreButton);
    }
    catch (e) {
        console.error(e);
    }
    // キーボードショートカット
    config.registerFlag("ui.useKeyboardShortcut", true, "Use Keyboard Shortcuts");
    unsafeWindow.addEventListener("keydown", (event) => {
        if (config.get("ui.useKeyboardShortcut", true)) {
            if (event.key == "Enter" && event.ctrlKey) {
                events.trig("testAndSubmit");
            }
            else if (event.key == "Enter" && event.altKey) {
                events.trig("testAllSamples");
            }
            else if (event.key == "Escape" && event.altKey) {
                pBottomMenu.then(bottomMenu => bottomMenu.toggle());
            }
        }
    });
})();
    })();
    // atcoder-tasks-page-colorizer
    (function(){
if (!/\/contests\/[^/]+\/tasks\/?$/.test(location.pathname)) return;
if (moment() < endTime) return;

$('#main-div thead th:last-child').before('<th width="10%" class="text-center">最終提出</th>');

function colorize(problems_info) {
	$('#main-div tbody tr').each((x,y) => {
		let problem_id = y.querySelector('td:nth-child(2) a').getAttribute('href').split('/').pop();
		let trial = problems_info.filter(x => x.problem_id == problem_id);
		colorize_row(y,trial);
	})

	function colorize_row(row, trial) {
		var submitted = trial.length != 0;
		var is_accepted = trial.map(x => x.result).includes('AC');
		var last_submit = !submitted ? null : trial.reduce((x,y) => x.epoch_second > y.epoch_second ? x : y);
		$(row.querySelector('td:last-child')).before(`<td class="text-center">${submitted ? `<a href="https://atcoder.jp/contests/${last_submit.contest_id}/submissions/${last_submit.id}">${moment.unix(last_submit.epoch_second).format("YYYY/MM/DD")}</a>` : '-'}</td>`);
		if(submitted) row.classList.add(is_accepted ? 'success' : 'warning');
    }
}
getSubmissions(userScreenName).then(colorize).catch(e => alert("colorizer: " + e));
    })();
    // atcoder-tasks-page-colorize-during-contests
    (function(){
if (!/\/contests\/[^/]+\/tasks\/?$/.test(location.pathname)) return;
const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(res.statusText);
    }
    const obj = (await res.json());
    return obj;
};
const fetchContestStandings = async (contestSlug) => {
    const url = `https://atcoder.jp/contests/${contestSlug}/standings/json`;
    return await fetchJson(url);
};

const getCurrentScores = async (contestSlug) => {
    const problemId2Info = new Map();
    const res = await fetch(`https://atcoder.jp/contests/${contestSlug}/score`);
    const scoreHtml = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(scoreHtml, 'text/html');
    doc.querySelectorAll('#main-div tbody tr').forEach((tableRow) => {
        const anchor1 = tableRow.querySelector('td:nth-child(1) a');
        if (anchor1 === null)
            throw new Error('問題リンクが見つかりませんでした');
        const problemId = anchor1.href.split('/').pop();
        if (problemId === undefined)
            throw new Error('問題IDが見つかりませんでした');
        const td3 = tableRow.querySelector('td:nth-child(3)');
        if (td3 === null || td3.textContent === null)
            throw new Error('スコアが不明な行があります');
        const score = Number(td3.textContent);
        const td4 = tableRow.querySelector('td:nth-child(4)');
        if (td4 === null || td4.textContent === null)
            throw new Error('提出日時が不明な行があります');
        const datetimeString = td4.textContent;
        // console.log(problemId, score, datetimeString);
        problemId2Info.set(problemId, [score, datetimeString]);
    });
    return problemId2Info;
};

class TaskListManager {
    constructor(mainContainer, contestSlug) {
        this.mainContainer = mainContainer;
        this.contestSlug = contestSlug;
        // ヘッダ挿入
        const headInsertPt = mainContainer.querySelector('thead th:last-child');
        if (headInsertPt === null)
            throw new Error('ヘッダ挿入ポイントが見つかりませんでした');
        headInsertPt.insertAdjacentHTML('beforebegin', '<th width="10%" class="text-center">得点</th><th class="text-center">提出日時</th>');
        // 問題一覧テーブルから，行・セル・問題IDを取り出してリストに収める
        this.rows = [];
        const rowElementss = this.mainContainer.querySelectorAll('#main-div tbody tr');
        rowElementss.forEach((rowElement) => {
            const anchor2 = rowElement.querySelector('td:nth-child(2) a');
            if (anchor2 === null)
                throw new Error('問題リンクが見つかりませんでした');
            const problemId = anchor2.href.split('/').pop();
            if (problemId === undefined)
                throw new Error('問題IDが見つかりませんでした');
            const tdInsertPt = rowElement.querySelector('td:last-child');
            if (tdInsertPt === null)
                throw new Error('td が見つかりませんでした');
            const scoreCell = document.createElement('td');
            const datetimeCell = document.createElement('td');
            scoreCell.classList.add('text-center');
            datetimeCell.classList.add('text-center');
            tdInsertPt.insertAdjacentElement('beforebegin', scoreCell);
            tdInsertPt.insertAdjacentElement('beforebegin', datetimeCell);
            scoreCell.textContent = '-';
            datetimeCell.textContent = '-';
            this.rows.push([problemId, rowElement, scoreCell, datetimeCell]);
        });
    }
    /** 「自分の得点状況」ページの情報からテーブルを更新する */
    async updateByScorePage() {
        this.problemId2Info = await getCurrentScores(this.contestSlug);
        this.rows.forEach(([problemId, rowElement, scoreCell, datetimeCell]) => {
            if (this.problemId2Info === undefined)
                return;
            if (this.problemId2Info.has(problemId)) {
                const [score, datetimeString] = this.problemId2Info.get(problemId);
                scoreCell.textContent = `${score}`;
                datetimeCell.textContent = datetimeString;
                if (datetimeString !== '-') {
                    rowElement.classList.add(score > 0 ? 'success' : 'danger');
                }
            }
            else {
                throw new Error(`スコア情報がありません：${problemId}`);
            }
        });
    }
    /** 順位表情報からテーブルを更新する */
    async updateByStandings() {
        // 一部常設コンテストは順位表情報が提供されておらず 404 が返ってくる
        let standings;
        try {
            standings = await fetchContestStandings(this.contestSlug);
        }
        catch (_a) {
            console.warn('atcoder-tasks-page-colorize-during-contests: このコンテストは順位表が提供されていません');
            return;
        }
        const userStandingsEntry = standings.StandingsData.find((_standingsEntry) => _standingsEntry.UserScreenName == userScreenName);
        if (userStandingsEntry === undefined)
            return;
        this.rows.forEach(([problemId, rowElement, scoreCell, datetimeCell]) => {
            if (!(problemId in userStandingsEntry.TaskResults))
                return;
            const taskResultEntry = userStandingsEntry.TaskResults[problemId];
            const dt = startTime.clone().add(taskResultEntry.Elapsed / 1000000000, 's');
            // console.log(dt.format());
            if (this.problemId2Info === undefined)
                throw new Error('先に updateByScorePage() を呼んでください');
            const [score] = this.problemId2Info.get(problemId);
            const scoreFromStandings = taskResultEntry.Score / 100;
            if (scoreFromStandings >= score) {
                scoreCell.textContent = `${scoreFromStandings}`;
                datetimeCell.textContent = `${dt.format('YYYY/MM/DD HH:mm:ss')}`;
            }
            if (taskResultEntry.Status === 1) {
                if (rowElement.classList.contains('danger'))
                    rowElement.classList.remove('danger');
                rowElement.classList.add('success');
            }
            else {
                if (rowElement.classList.contains('success'))
                    rowElement.classList.remove('success');
                rowElement.classList.add('danger');
            }
        });
    }
}

void (async () => {
    // 終了後のコンテストに対する処理は以下のスクリプトに譲る：
    // https://greasyfork.org/ja/scripts/380404-atcoder-tasks-page-colorizer
    if (moment() >= endTime)
        return;
    const mainContainer = document.getElementById('main-container');
    if (mainContainer === null)
        throw new Error('コンテナが見つかりませんでした');
    const taskListManager = new TaskListManager(mainContainer, contestScreenName);
    await taskListManager.updateByScorePage();
    console.log('atcoder-tasks-page-colorize-during-contests: updateByScorePage() ended');
    await taskListManager.updateByStandings();
    console.log('atcoder-tasks-page-colorize-during-contests: updateByStandings() ended');
})();
    })();
    //ac-predictor
    (function(){
var config_header_text$1 = "ac-predictor 設定";
var config_hideDuringContest_label$1 = "コンテスト中に予測を非表示にする";
var config_hideUntilFixed_label$1 = "パフォーマンスが確定するまで予測を非表示にする";
var config_useFinalResultOnVirtual_label$1 = "バーチャル参加時のパフォーマンス計算に最終結果を用いる";
var config_useFinalResultOnVirtual_description$1 = "チェックを入れると、当時の参加者が既にコンテストを終えているものとしてパフォーマンスを計算します。";
var config_dropdown$1 = "ac-predictor 設定";
var standings_performance_column_label$1 = "perf";
var standings_rate_change_column_label$1 = "レート変化";
var standings_click_to_compute_label$1 = "クリックして計算";
var standings_not_provided_label$1 = "提供不可";
var jaJson = {
	config_header_text: config_header_text$1,
	config_hideDuringContest_label: config_hideDuringContest_label$1,
	config_hideUntilFixed_label: config_hideUntilFixed_label$1,
	config_useFinalResultOnVirtual_label: config_useFinalResultOnVirtual_label$1,
	config_useFinalResultOnVirtual_description: config_useFinalResultOnVirtual_description$1,
	config_dropdown: config_dropdown$1,
	standings_performance_column_label: standings_performance_column_label$1,
	standings_rate_change_column_label: standings_rate_change_column_label$1,
	standings_click_to_compute_label: standings_click_to_compute_label$1,
	standings_not_provided_label: standings_not_provided_label$1
};

var config_header_text = "ac-predictor settings";
var config_hideDuringContest_label = "hide prediction during contests";
var config_hideUntilFixed_label = "hide prediction until performances are fixed";
var config_useFinalResultOnVirtual_label = "use final result as a performance reference during the virtual participation";
var config_useFinalResultOnVirtual_description = "If enabled, the performance is calculated as if the original participant had already done the contest.";
var config_dropdown = "ac-predictor";
var standings_performance_column_label = "perf";
var standings_rate_change_column_label = "rating delta";
var standings_click_to_compute_label = "click to compute";
var standings_not_provided_label = "not provided";
var enJson = {
	config_header_text: config_header_text,
	config_hideDuringContest_label: config_hideDuringContest_label,
	config_hideUntilFixed_label: config_hideUntilFixed_label,
	config_useFinalResultOnVirtual_label: config_useFinalResultOnVirtual_label,
	config_useFinalResultOnVirtual_description: config_useFinalResultOnVirtual_description,
	config_dropdown: config_dropdown,
	standings_performance_column_label: standings_performance_column_label,
	standings_rate_change_column_label: standings_rate_change_column_label,
	standings_click_to_compute_label: standings_click_to_compute_label,
	standings_not_provided_label: standings_not_provided_label
};

// should not be here
function getCurrentLanguage() {
    const elems = document.querySelectorAll("#navbar-collapse .dropdown > a");
    if (elems.length == 0)
        return "JA";
    for (let i = 0; i < elems.length; i++) {
        if (elems[i].textContent?.includes("English"))
            return "EN";
        if (elems[i].textContent?.includes("日本語"))
            return "JA";
    }
    console.warn("language detection failed. fallback to English");
    return "EN";
}
const language = getCurrentLanguage();
const currentJson = { "EN": enJson, "JA": jaJson }[language];
function getTranslation(label) {
    return currentJson[label];
}
function substitute(input) {
    for (const key in currentJson) {
        // @ts-ignore
        input = input.replaceAll(`{${key}}`, currentJson[key]);
    }
    return input;
}

const configKey = "ac-predictor-config";
const defaultConfig = {
    useResults: true,
    hideDuringContest: false,
    isDebug: false,
    hideUntilFixed: false,
    useFinalResultOnVirtual: false,
    compareComputations: false
};
function getConfigObj() {
    const val = localStorage.getItem(configKey) ?? "{}";
    let config;
    try {
        config = JSON.parse(val);
    }
    catch {
        console.warn("invalid config found", val);
        config = {};
    }
    return { ...defaultConfig, ...config };
}
function storeConfigObj(config) {
    localStorage.setItem(configKey, JSON.stringify(config));
}
function getConfig(configKey) {
    return getConfigObj()[configKey];
}
function setConfig(key, value) {
    const config = getConfigObj();
    config[key] = value;
    storeConfigObj(config);
}

const isDebug = location.hash.includes("ac-predictor-debug") || getConfig("isDebug");
function isDebugMode() {
    return isDebug;
}

var modalHTML = "<div id=\"modal-ac-predictor-settings\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\">\n\t<div class=\"modal-dialog\" role=\"document\">\n\t<div class=\"modal-content\">\n\t\t<div class=\"modal-header\">\n\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">×</span></button>\n\t\t\t<h4 class=\"modal-title\">{config_header_text}</h4>\n\t\t</div>\n\t\t<div class=\"modal-body\">\n\t\t\t<div class=\"container-fluid\">\n\t\t\t\t<div class=\"settings-row\" class=\"row\">\n\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"modal-footer\">\n\t\t\t<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">close</button>\n\t\t</div>\n\t</div>\n</div>\n</div>";

var newDropdownElem = "<li><a id=\"ac-predictor-settings-dropdown-button\" data-toggle=\"modal\" data-target=\"#modal-ac-predictor-settings\" style=\"cursor : pointer;\"><i class=\"a-icon a-icon-setting\"></i> {config_dropdown}</a></li>\n";

var legacyDropdownElem = "<li><a id=\"ac-predictor-settings-dropdown-button\" data-toggle=\"modal\" data-target=\"#modal-ac-predictor-settings\" style=\"cursor : pointer;\"><span class=\"glyphicon glyphicon-wrench\" aria-hidden=\"true\"></span> {config_dropdown}</a></li>\n";

class ConfigView {
    modalElement;
    constructor(modalElement) {
        this.modalElement = modalElement;
    }
    addCheckbox(label, val, description, handler) {
        const settingsRow = this.getSettingsRow();
        const div = document.createElement("div");
        div.classList.add("checkbox");
        const labelElem = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = val;
        labelElem.append(input);
        labelElem.append(label);
        if (description) {
            const descriptionDiv = document.createElement("div");
            descriptionDiv.append(description);
            descriptionDiv.classList.add("small");
            descriptionDiv.classList.add("gray");
            labelElem.append(descriptionDiv);
        }
        div.append(labelElem);
        settingsRow.append(div);
        input.addEventListener("change", () => {
            handler(input.checked);
        });
    }
    addHeader(level, content) {
        const settingsRow = this.getSettingsRow();
        const div = document.createElement(`h${level}`);
        div.textContent = content;
        settingsRow.append(div);
    }
    getSettingsRow() {
        return this.modalElement.querySelector(".settings-row");
    }
    static Create() {
        document.querySelector("body")?.insertAdjacentHTML("afterbegin", substitute(modalHTML));
        document.querySelector(".header-mypage_list li:nth-last-child(1)")?.insertAdjacentHTML("beforebegin", substitute(newDropdownElem));
        document.querySelector(".navbar-right .dropdown-menu .divider:nth-last-child(2)")?.insertAdjacentHTML("beforebegin", substitute(legacyDropdownElem));
        const element = document.querySelector("#modal-ac-predictor-settings");
        if (element === null) {
            throw new Error("settings modal not found");
        }
        return new ConfigView(element);
    }
}

class ConfigController {
    register() {
        const configView = ConfigView.Create();
        // TODO: 流石に処理をまとめたい
        configView.addCheckbox(getTranslation("config_useFinalResultOnVirtual_label"), getConfig("useFinalResultOnVirtual"), getTranslation("config_useFinalResultOnVirtual_description"), val => setConfig("useFinalResultOnVirtual", val));
        configView.addCheckbox(getTranslation("config_hideDuringContest_label"), getConfig("hideDuringContest"), null, val => setConfig("hideDuringContest", val));
        configView.addCheckbox(getTranslation("config_hideUntilFixed_label"), getConfig("hideUntilFixed"), null, val => setConfig("hideUntilFixed", val));
        if (isDebugMode()) {
            configView.addCheckbox("[DEBUG] enable debug mode", getConfig("isDebug"), null, val => setConfig("isDebug", val));
            configView.addCheckbox("[DEBUG] use results", getConfig("useResults"), null, val => setConfig("useResults", val));
            configView.addCheckbox("[DEBUG] compare", getConfig("compareComputations"), null, val => setConfig("compareComputations", val));
        }
    }
}

async function getAPerfs(contestScreenName) {
    const result = await fetch(`https://data.ac-predictor.com/aperfs/${contestScreenName}.json`);
    if (!result.ok) {
        throw new Error(`Failed to fetch aperfs: ${result.status}`);
    }
    return await result.json();
}

// [start, end]
class Range {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    contains(val) {
        return this.start <= val && val <= this.end;
    }
    hasValue() {
        return this.start <= this.end;
    }
}

class ContestDetails {
    contestName;
    contestScreenName;
    contestType;
    startTime;
    duration;
    ratedrange;
    constructor(contestName, contestScreenName, contestType, startTime, duration, ratedRange) {
        this.contestName = contestName;
        this.contestScreenName = contestScreenName;
        this.contestType = contestType;
        this.startTime = startTime;
        this.duration = duration;
        this.ratedrange = ratedRange;
    }
    get endTime() {
        return new Date(this.startTime.getTime() + this.duration * 1000);
    }
    get defaultAPerf() {
        if (this.contestType == "heuristic") {
            return 1000;
        }
        else { // algo
            if (!this.ratedrange.hasValue()) {
                throw new Error("unrated contest");
            }
            if (!this.ratedrange.contains(0)) {
                return 0; // value is not relevant as it is never used
            }
            // ref: https://atcoder.jp/posts/1591
            const DEFAULT_CHANGED_TO_1200 = new Date("2025-11-01");
            if (DEFAULT_CHANGED_TO_1200 < this.startTime) {
                return 1200;
            }
            // TODO: find default value; it should have changed when the new ABC was introduced
            // const FIRST_DEFAULT_CHANGES = new Date("2019-05-25");
            // if (FIRST_DEFAULT_CHANGES < this.startTime) { ... }
            // ref: AtCoder Rating System ver. 1.00
            // APerf of newcomers are set to Center, where Center = 1200 for AGC,
            // Center = 1000 for ARC and Center = 800 for ABC
            // old ABC
            if (this.ratedrange.end == 1199) {
                return 800;
            }
            // new ABC
            if (this.ratedrange.end == 1999) {
                return 800;
            }
            // ARC
            if (this.ratedrange.end == 2799) {
                return 1000;
            }
            // AGC
            return 1200;
        }
    }
    get performanceCap() {
        if (this.contestType == "heuristic")
            return Infinity;
        if (!this.ratedrange.hasValue()) {
            throw new Error("unrated contest");
        }
        if (4000 <= this.ratedrange.end)
            return Infinity;
        return this.ratedrange.end + 1 + 400;
    }
    beforeContest(dateTime) {
        return dateTime < this.startTime;
    }
    duringContest(dateTime) {
        return this.startTime < dateTime && dateTime < this.endTime;
    }
    isOver(dateTime) {
        return this.endTime < dateTime;
    }
}

async function getContestDetails() {
    const result = await fetch(`https://data.ac-predictor.com/contest-details.json`);
    if (!result.ok) {
        throw new Error(`Failed to fetch contest details: ${result.status}`);
    }
    const parsed = await result.json();
    const res = [];
    for (const elem of parsed) {
        if (typeof elem !== "object")
            throw new Error("invalid object returned");
        if (typeof elem.contestName !== "string")
            throw new Error("invalid object returned");
        const contestName = elem.contestName;
        if (typeof elem.contestScreenName !== "string")
            throw new Error("invalid object returned");
        const contestScreenName = elem.contestScreenName;
        if (elem.contestType !== "algorithm" && elem.contestType !== "heuristic")
            throw new Error("invalid object returned");
        const contestType = elem.contestType;
        if (typeof elem.startTime !== "number")
            throw new Error("invalid object returned");
        const startTime = new Date(elem.startTime * 1000);
        if (typeof elem.duration !== "number")
            throw new Error("invalid object returned");
        const duration = elem.duration;
        if (typeof elem.ratedrange !== "object" || typeof elem.ratedrange[0] !== "number" || typeof elem.ratedrange[1] !== "number")
            throw new Error("invalid object returned");
        const ratedRange = new Range(elem.ratedrange[0], elem.ratedrange[1]);
        res.push(new ContestDetails(contestName, contestScreenName, contestType, startTime, duration, ratedRange));
    }
    return res;
}

class Cache {
    cacheDuration;
    cacheExpires = new Map();
    cacheData = new Map();
    constructor(cacheDuration) {
        this.cacheDuration = cacheDuration;
    }
    has(key) {
        return this.cacheExpires.has(key) || Date.now() <= this.cacheExpires.get(key);
    }
    set(key, content) {
        const expire = Date.now() + this.cacheDuration;
        this.cacheExpires.set(key, expire);
        this.cacheData.set(key, content);
    }
    get(key) {
        if (!this.has(key)) {
            throw new Error(`invalid key: ${key}`);
        }
        return this.cacheData.get(key);
    }
}

const handlers = [];
function addHandler(handler) {
    handlers.push(handler);
}
// absurd hack to steal ajax response data for caching
// @ts-ignore
$(document).on("ajaxComplete", (_, xhr, settings) => {
    if (xhr.status == 200) {
        for (const handler of handlers) {
            handler(xhr.responseText, settings.url);
        }
    }
});

let StandingsWrapper$2 = class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            const userScreenName = typeof (data.Additional["standings.extendedContestRank"]) == "undefined" ? `extended:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const userScreenName = typeof (data.Additional["standings.extendedContestRank"]) == "undefined" ? `extended:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType) {
        if (contestType === "algorithm") {
            return data.IsRated && typeof (data.Additional["standings.extendedContestRank"]) != "undefined";
        }
        else {
            return data.IsRated && typeof (data.Additional["standings.extendedContestRank"]) != "undefined" && data.TotalResult.Count !== 0;
        }
    }
};
const STANDINGS_CACHE_DURATION$2 = 10 * 1000;
const cache$4 = new Cache(STANDINGS_CACHE_DURATION$2);
async function getExtendedStandings(contestScreenName) {
    if (!cache$4.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/extended/json`);
        if (!result.ok) {
            throw new Error(`Failed to fetch extended standings: ${result.status}`);
        }
        cache$4.set(contestScreenName, await result.json());
    }
    return new StandingsWrapper$2(cache$4.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/extended\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$4.set(contestScreenName, JSON.parse(content));
});

class EloPerformanceProvider {
    ranks;
    ratings;
    cap;
    rankMemo = new Map();
    constructor(ranks, ratings, cap) {
        this.ranks = ranks;
        this.ratings = ratings;
        this.cap = cap;
    }
    availableFor(userScreenName) {
        return this.ranks.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`User ${userScreenName} not found`);
        }
        const rank = this.ranks.get(userScreenName);
        return this.getPerformanceForRank(rank);
    }
    getPerformances() {
        const performances = new Map();
        for (const userScreenName of this.ranks.keys()) {
            performances.set(userScreenName, this.getPerformance(userScreenName));
        }
        return performances;
    }
    getPerformanceForRank(rank) {
        let upper = 6144;
        let lower = -2048;
        while (upper - lower > 0.5) {
            const mid = (upper + lower) / 2;
            if (rank > this.getRankForPerformance(mid))
                upper = mid;
            else
                lower = mid;
        }
        return Math.min(this.cap, Math.round((upper + lower) / 2));
    }
    getRankForPerformance(performance) {
        if (this.rankMemo.has(performance))
            return this.rankMemo.get(performance);
        const res = this.ratings.reduce((val, APerf) => val + 1.0 / (1.0 + Math.pow(6.0, (performance - APerf) / 400.0)), 0.5);
        this.rankMemo.set(performance, res);
        return res;
    }
}

function getRankToUsers(ranks) {
    const rankToUsers = new Map();
    for (const [userScreenName, rank] of ranks) {
        if (!rankToUsers.has(rank))
            rankToUsers.set(rank, []);
        rankToUsers.get(rank).push(userScreenName);
    }
    return rankToUsers;
}
function getMaxRank(ranks) {
    return Math.max(...ranks.values());
}
class InterpolatePerformanceProvider {
    ranks;
    maxRank;
    rankToUsers;
    baseProvider;
    constructor(ranks, baseProvider) {
        this.ranks = ranks;
        this.maxRank = getMaxRank(ranks);
        this.rankToUsers = getRankToUsers(ranks);
        this.baseProvider = baseProvider;
    }
    availableFor(userScreenName) {
        return this.ranks.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`User ${userScreenName} not found`);
        }
        if (this.performanceCache.has(userScreenName))
            return this.performanceCache.get(userScreenName);
        let rank = this.ranks.get(userScreenName);
        while (rank <= this.maxRank) {
            const perf = this.getPerformanceIfAvailable(rank);
            if (perf !== null) {
                return perf;
            }
            rank++;
        }
        this.performanceCache.set(userScreenName, -Infinity);
        return -Infinity;
    }
    performanceCache = new Map();
    getPerformances() {
        let currentPerformance = -Infinity;
        const res = new Map();
        for (let rank = this.maxRank; rank >= 0; rank--) {
            const users = this.rankToUsers.get(rank);
            if (users === undefined)
                continue;
            const perf = this.getPerformanceIfAvailable(rank);
            if (perf !== null)
                currentPerformance = perf;
            for (const userScreenName of users) {
                res.set(userScreenName, currentPerformance);
            }
        }
        this.performanceCache = res;
        return res;
    }
    cacheForRank = new Map();
    getPerformanceIfAvailable(rank) {
        if (!this.rankToUsers.has(rank))
            return null;
        if (this.cacheForRank.has(rank))
            return this.cacheForRank.get(rank);
        for (const userScreenName of this.rankToUsers.get(rank)) {
            if (!this.baseProvider.availableFor(userScreenName))
                continue;
            const perf = this.baseProvider.getPerformance(userScreenName);
            this.cacheForRank.set(rank, perf);
            return perf;
        }
        return null;
    }
}

function normalizeRank(ranks) {
    const rankValues = [...new Set(ranks.values()).values()];
    const rankToUsers = new Map();
    for (const [userScreenName, rank] of ranks) {
        if (!rankToUsers.has(rank))
            rankToUsers.set(rank, []);
        rankToUsers.get(rank).push(userScreenName);
    }
    rankValues.sort((a, b) => a - b);
    const res = new Map();
    let currentRank = 1;
    for (const rank of rankValues) {
        const users = rankToUsers.get(rank);
        const averageRank = currentRank + (users.length - 1) / 2;
        for (const userScreenName of users) {
            res.set(userScreenName, averageRank);
        }
        currentRank += users.length;
    }
    return res;
}

//Copyright © 2017 koba-e964.
//from : https://github.com/koba-e964/atcoder-rating-estimator
const finf = bigf(400);
function bigf(n) {
    let pow1 = 1;
    let pow2 = 1;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; ++i) {
        pow1 *= 0.81;
        pow2 *= 0.9;
        numerator += pow1;
        denominator += pow2;
    }
    return Math.sqrt(numerator) / denominator;
}
function f(n) {
    return ((bigf(n) - finf) / (bigf(1) - finf)) * 1200.0;
}
/**
 * calculate unpositivized rating from performance history
 * @param {Number[]} [history] performance history with ascending order
 * @returns {Number} unpositivized rating
 */
function calcAlgRatingFromHistory(history) {
    const n = history.length;
    let pow = 1;
    let numerator = 0.0;
    let denominator = 0.0;
    for (let i = n - 1; i >= 0; i--) {
        pow *= 0.9;
        numerator += Math.pow(2, history[i] / 800.0) * pow;
        denominator += pow;
    }
    return Math.log2(numerator / denominator) * 800.0 - f(n);
}
/**
 * calculate unpositivized rating from last state
 * @param {Number} [last] last unpositivized rating
 * @param {Number} [perf] performance
 * @param {Number} [ratedMatches] count of participated rated contest
 * @returns {number} estimated unpositivized rating
 */
function calcAlgRatingFromLast(last, perf, ratedMatches) {
    if (ratedMatches === 0)
        return perf - 1200;
    last += f(ratedMatches);
    const weight = 9 - 9 * 0.9 ** ratedMatches;
    const numerator = weight * 2 ** (last / 800.0) + 2 ** (perf / 800.0);
    const denominator = 1 + weight;
    return Math.log2(numerator / denominator) * 800.0 - f(ratedMatches + 1);
}
/**
 * calculate the performance required to reach a target rate
 * @param {Number} [targetRating] targeted unpositivized rating
 * @param {Number[]} [history] performance history with ascending order
 * @returns {number} performance
 */
function calcRequiredPerformance(targetRating, history) {
    let valid = 10000.0;
    let invalid = -10000.0;
    for (let i = 0; i < 100; ++i) {
        const mid = (invalid + valid) / 2;
        const rating = Math.round(calcAlgRatingFromHistory(history.concat([mid])));
        if (targetRating <= rating)
            valid = mid;
        else
            invalid = mid;
    }
    return valid;
}
/**
 * Gets the weight used in the heuristic rating calculation
 * based on its start and end dates
 * @param {Date} startAt - The start date of the contest.
 * @param {Date} endAt - The end date of the contest.
 * @returns {number} The weight of the contest.
 */
function getWeight(startAt, endAt) {
    const isShortContest = endAt.getTime() - startAt.getTime() < 24 * 60 * 60 * 1000;
    if (endAt < new Date("2025-01-01T00:00:00+09:00")) {
        return 1;
    }
    return isShortContest ? 0.5 : 1;
}
/**
 * calculate unpositivized rating from performance history
 * @param {RatingMaterial[]} [history] performance histories
 * @returns {Number} unpositivized rating
 */
function calcHeuristicRatingFromHistory(history) {
    const S = 724.4744301;
    const R = 0.8271973364;
    const qs = [];
    for (const material of history) {
        const adjustedPerformance = material.Performance + 150 - 100 * material.DaysFromLatestContest / 365;
        for (let i = 1; i <= 100; i++) {
            qs.push({ q: adjustedPerformance - S * Math.log(i), weight: material.Weight });
        }
    }
    qs.sort((a, b) => b.q - a.q);
    let r = 0.0;
    let s = 0.0;
    for (const { q, weight } of qs) {
        s += weight;
        r += q * (R ** (s - weight) - R ** s);
    }
    return r;
}
/**
 * (-inf, inf) -> (0, inf)
 * @param {Number} [rating] unpositivized rating
 * @returns {number} positivized rating
 */
function positivizeRating(rating) {
    if (rating >= 400.0) {
        return rating;
    }
    return 400.0 * Math.exp((rating - 400.0) / 400.0);
}
/**
 * (0, inf) -> (-inf, inf)
 * @param {Number} [rating] positivized rating
 * @returns {number} unpositivized rating
 */
function unpositivizeRating(rating) {
    if (rating >= 400.0) {
        return rating;
    }
    return 400.0 + 400.0 * Math.log(rating / 400.0);
}
const colorNames = ["unrated", "gray", "brown", "green", "cyan", "blue", "yellow", "orange", "red"];
function getColor(rating) {
    const colorIndex = rating > 0 ? Math.min(Math.floor(rating / 400) + 1, 8) : 0;
    return colorNames[colorIndex];
}

const PATH_PREFIX = "/contests/";
function getContestScreenName() {
    const location = document.location.pathname;
    if (!location.startsWith(PATH_PREFIX)) {
        throw Error("not on the contest page");
    }
    return location.substring(PATH_PREFIX.length).split("/")[0];
}

function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

class StandingsLoadingView {
    element;
    pendingHooks;
    constructor(element) {
        this.element = element;
        this.pendingHooks = [];
        new MutationObserver(() => this.resolveHooksIfPossible()).observe(this.element, { attributes: true });
    }
    onLoad(hook) {
        if (this.isStandingsLoaded()) {
            hook();
        }
        else {
            this.pendingHooks.push(hook);
        }
    }
    resolveHooksIfPossible() {
        if (this.pendingHooks.length === 0)
            return;
        if (!this.isStandingsLoaded())
            return;
        const hooks = this.pendingHooks;
        this.pendingHooks = [];
        hooks.forEach(f => f());
    }
    ;
    isStandingsLoaded() {
        return this.element.style.display === "none";
    }
    static Get() {
        const loadingElem = document.querySelector("#vue-standings .loading-show");
        if (loadingElem === null) {
            throw new Error("loadingElem not found");
        }
        return new StandingsLoadingView(loadingElem);
    }
}

function toSignedString (n) {
    return `${n >= 0 ? "+" : "-"}${Math.abs(n)}`;
}

function addStyle(styleSheet) {
    const styleElem = document.createElement("style");
    styleElem.textContent = styleSheet;
    document.getElementsByTagName("head")[0].append(styleElem);
}

function getSpan(innerElements, classList) {
    const span = document.createElement("span");
    span.append(...innerElements);
    span.classList.add(...classList);
    return span;
}

function getRatingSpan(rate) {
    return getSpan([rate.toString()], ["bold", "user-" + getColor(rate)]);
}

var style = "/* Tooltip container */\n.my-tooltip {\n  position: relative;\n  display: inline-block;\n}\n\n/* Tooltip text */\n.my-tooltip .my-tooltiptext {\n  visibility: hidden;\n  width: 120px;\n  background-color: black;\n  color: #fff;\n  text-align: center;\n  padding: 5px 0;\n  border-radius: 6px;\n  /* Position the tooltip text - see examples below! */\n  position: absolute;\n  top: 50%;\n  right: 100%;\n  z-index: 1;\n}\n\n/* Show the tooltip text when you mouse over the tooltip container */\n.my-tooltip:hover .my-tooltiptext {\n  visibility: visible;\n}";

addStyle(style);
function getFadedSpan(innerElements) {
    return getSpan(innerElements, ["grey"]);
}
function getRatedRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getRatingSpan(result.oldRating), " → ", getRatingSpan(result.newRating), " ", getFadedSpan([`(${toSignedString(result.newRating - result.oldRating)})`]));
    return elem;
}
function getUnratedRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getRatingSpan(result.oldRating), " ", getFadedSpan(["(unrated)"]));
    return elem;
}
function getDefferedRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getRatingSpan(result.oldRating), " → ", getSpan(["???"], ["bold"]), document.createElement("br"), getFadedSpan([`(${getTranslation("standings_click_to_compute_label")})`]));
    async function listener() {
        elem.removeEventListener("click", listener);
        elem.replaceChildren(getFadedSpan(["loading..."]));
        let newRating;
        try {
            newRating = await result.newRatingCalculator();
        }
        catch (e) {
            elem.append(getSpan(["error on load"], []), document.createElement("br"), getSpan(["(hover to see details)"], ["grey", "small"]), getSpan([e.toString()], ["my-tooltiptext"]));
            elem.classList.add("my-tooltip");
            return;
        }
        const newElem = getRatedRatingElem({ type: "rated", performance: result.performance, oldRating: result.oldRating, newRating: newRating });
        elem.replaceChildren(newElem);
    }
    elem.addEventListener("click", listener);
    return elem;
}
function getPerfOnlyRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getFadedSpan([`(${getTranslation("standings_not_provided_label")})`]));
    return elem;
}
function getErrorRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getSpan(["error on load"], []), document.createElement("br"), getSpan(["(hover to see details)"], ["grey", "small"]), getSpan([result.message], ["my-tooltiptext"]));
    elem.classList.add("my-tooltip");
    return elem;
}
function getRatingElem(result) {
    if (result.type == "rated")
        return getRatedRatingElem(result);
    if (result.type == "unrated")
        return getUnratedRatingElem(result);
    if (result.type == "deffered")
        return getDefferedRatingElem(result);
    if (result.type == "perfonly")
        return getPerfOnlyRatingElem();
    if (result.type == "error")
        return getErrorRatingElem(result);
    throw new Error("unreachable");
}
function getPerfElem(result) {
    if (result.type == "error")
        return getSpan(["-"], []);
    return getRatingSpan(result.performance);
}
const headerHtml = `<th class="ac-predictor-standings-elem" style="width:84px;min-width:84px;">${getTranslation("standings_performance_column_label")}</th><th class="ac-predictor-standings-elem" style="width:168px;min-width:168px;">${getTranslation("standings_rate_change_column_label")}</th>`;
function modifyHeader(header) {
    header.insertAdjacentHTML("beforeend", headerHtml);
}
function isFooter(row) {
    return row.firstElementChild?.classList.contains("colspan");
}
async function modifyStandingsRow(row, results) {
    const rankText = row.children[0].textContent;
    const usernameSpan = row.querySelector(".standings-username .username span");
    let userScreenName = usernameSpan?.textContent ?? null;
    // unratedかつ順位が未表示ならば参加者でない、というヒューリスティック（お気に入り順位表でのエラー解消用）
    if (usernameSpan?.className === "user-unrated" && rankText === "-") {
        userScreenName = null;
    }
    // TODO: この辺のロジックがここにあるの嫌だね……
    if (userScreenName !== null && row.querySelector(".standings-username .username img[src='//img.atcoder.jp/assets/icon/ghost.svg']")) {
        userScreenName = `ghost:${userScreenName}`;
    }
    if (userScreenName !== null && row.classList.contains("info") && 3 <= row.children.length && row.children[2].textContent == "-") {
        // 延長線順位表用
        userScreenName = `extended:${userScreenName}`;
    }
    const perfCell = document.createElement("td");
    perfCell.classList.add("ac-predictor-standings-elem", "standings-result");
    const ratingCell = document.createElement("td");
    ratingCell.classList.add("ac-predictor-standings-elem", "standings-result");
    if (userScreenName === null) {
        perfCell.append("-");
        ratingCell.append("-");
    }
    else {
        const result = await results(userScreenName);
        perfCell.append(getPerfElem(result));
        ratingCell.append(getRatingElem(result));
    }
    row.insertAdjacentElement("beforeend", perfCell);
    row.insertAdjacentElement("beforeend", ratingCell);
}
function modifyFooter(footer) {
    footer.insertAdjacentHTML("beforeend", '<td class="ac-predictor-standings-elem" colspan="2">-</td>');
}
class StandingsTableView {
    element;
    provider;
    refreshHooks = [];
    constructor(element, resultDataProvider) {
        this.element = element;
        this.provider = resultDataProvider;
        this.initHandler();
    }
    onRefreshed(hook) {
        this.refreshHooks.push(hook);
    }
    update() {
        this.removeOldElement();
        const header = this.element.querySelector("thead tr");
        if (!header)
            console.warn("header element not found", this.element);
        else
            modifyHeader(header);
        this.element.querySelectorAll("tbody tr").forEach((row) => {
            if (isFooter(row))
                modifyFooter(row);
            else
                modifyStandingsRow(row, this.provider);
        });
    }
    removeOldElement() {
        this.element.querySelectorAll(".ac-predictor-standings-elem").forEach((elem) => elem.remove());
    }
    initHandler() {
        new MutationObserver(() => this.update()).observe(this.element.tBodies[0], {
            childList: true,
        });
        const statsRow = this.element.querySelector(".standings-statistics");
        if (statsRow === null) {
            throw new Error("statsRow not found");
        }
        const acElems = statsRow.querySelectorAll(".standings-ac");
        const refreshObserver = new MutationObserver((records) => {
            if (isDebugMode())
                console.log("fire refreshHooks", records);
            this.refreshHooks.forEach(f => f());
        });
        acElems.forEach(elem => refreshObserver.observe(elem, { childList: true }));
    }
    static Get(resultDataProvider) {
        const tableElem = document.querySelector(".table-responsive table");
        return new StandingsTableView(tableElem, resultDataProvider);
    }
}

class ExtendedStandingsPageController {
    contestDetails;
    performanceProvider;
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("contest details not found");
        }
        this.contestDetails = contestDetails;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.performanceProvider)
                return { "type": "error", "message": "performanceProvider missing" };
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `performance not available for ${userScreenName}` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            return { type: "perfonly", performance: positivizedPerformance };
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("contestDetails missing");
        const extendedStandings = await getExtendedStandings(this.contestDetails.contestScreenName);
        const aperfsObj = await getAPerfs(this.contestDetails.contestScreenName);
        const defaultAPerf = this.contestDetails.defaultAPerf;
        const normalizedRanks = normalizeRank(extendedStandings.toRanks(true, this.contestDetails.contestType));
        const aperfsList = extendedStandings.toRatedUsers(this.contestDetails.contestType).map(userScreenName => hasOwnProperty(aperfsObj, userScreenName) ? aperfsObj[userScreenName] : defaultAPerf);
        const basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
        const ranks = extendedStandings.toRanks();
        this.performanceProvider = new InterpolatePerformanceProvider(ranks, basePerformanceProvider);
    }
}

class HistoriesWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRatingMaterials(latestContestDate, contestDurationSecondProvider) {
        const toUtcDate = (date) => Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
        const results = [];
        for (const history of this.data) {
            if (!history.IsRated)
                continue;
            const endTime = new Date(history.EndTime);
            const startTime = new Date(endTime.getTime() - contestDurationSecondProvider(history.ContestScreenName) * 1000);
            results.push({
                Performance: history.Performance,
                Weight: getWeight(startTime, endTime),
                DaysFromLatestContest: toUtcDate(latestContestDate) - toUtcDate(endTime),
            });
        }
        return results;
    }
}
const HISTORY_CACHE_DURATION = 60 * 60 * 1000;
const cache$3 = new Cache(HISTORY_CACHE_DURATION);
async function getHistory(userScreenName, contestType = "algorithm") {
    const key = `${userScreenName}:${contestType}`;
    if (!cache$3.has(key)) {
        const result = await fetch(`https://atcoder.jp/users/${userScreenName}/history/json?contestType=${contestType}`);
        if (!result.ok) {
            throw new Error(`Failed to fetch history: ${result.status}`);
        }
        cache$3.set(key, await result.json());
    }
    return new HistoriesWrapper(cache$3.get(key));
}

// @ts-nocheck
var dom$1 = "<div id=\"estimator-alert\"></div>\n<div class=\"row\">\n\t<div class=\"input-group\">\n\t\t<span class=\"input-group-addon\" id=\"estimator-input-desc\"></span>\n\t\t<input type=\"number\" class=\"form-control\" id=\"estimator-input\">\n\t</div>\n</div>\n<div class=\"row\">\n\t<div class=\"input-group\">\n\t\t<span class=\"input-group-addon\" id=\"estimator-res-desc\"></span>\n\t\t<input class=\"form-control\" id=\"estimator-res\" disabled=\"disabled\">\n\t\t<span class=\"input-group-btn\">\n\t\t\t<button class=\"btn btn-default\" id=\"estimator-toggle\">入替</button>\n\t\t</span>\n\t</div>\n</div>\n<div class=\"row\" style=\"margin: 10px 0px;\">\n\t<a class=\"btn btn-default col-xs-offset-8 col-xs-4\" rel=\"nofollow\" onclick=\"window.open(encodeURI(decodeURI(this.href)),'twwindow','width=550, height=450, personalbar=0, toolbar=0, scrollbars=1'); return false;\" id=\"estimator-tweet\">ツイート</a>\n</div>";
class EstimatorModel {
    inputDesc;
    resultDesc;
    perfHistory;
    constructor(inputValue, perfHistory) {
        this.inputDesc = "";
        this.resultDesc = "";
        this.perfHistory = perfHistory;
        this.updateInput(inputValue);
    }
    inputValue;
    resultValue;
    updateInput(value) {
        this.inputValue = value;
        this.resultValue = this.calcResult(value);
    }
    toggle() {
        return null;
    }
    calcResult(input) {
        return input;
    }
}
class CalcRatingModel extends EstimatorModel {
    constructor(inputValue, perfHistory) {
        super(inputValue, perfHistory);
        this.inputDesc = "パフォーマンス";
        this.resultDesc = "到達レーティング";
    }
    // @ts-ignore
    toggle() {
        return new CalcPerfModel(this.resultValue, this.perfHistory);
    }
    calcResult(input) {
        return positivizeRating(calcAlgRatingFromHistory(this.perfHistory.concat([input])));
    }
}
class CalcPerfModel extends EstimatorModel {
    constructor(inputValue, perfHistory) {
        super(inputValue, perfHistory);
        this.inputDesc = "目標レーティング";
        this.resultDesc = "必要パフォーマンス";
    }
    // @ts-ignore
    toggle() {
        return new CalcRatingModel(this.resultValue, this.perfHistory);
    }
    calcResult(input) {
        return calcRequiredPerformance(unpositivizeRating(input), this.perfHistory);
    }
}
function GetEmbedTweetLink(content, url) {
    return `https://twitter.com/share?text=${encodeURI(content)}&url=${encodeURI(url)}`;
}
function getLS(key) {
    const val = localStorage.getItem(key);
    return (val ? JSON.parse(val) : val);
}
function setLS(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    }
    catch (error) {
        console.log(error);
    }
}
const models = [CalcPerfModel, CalcRatingModel];
function GetModelFromStateCode(state, value, history) {
    let model = models.find((model) => model.name === state);
    if (!model)
        model = CalcPerfModel;
    return new model(value, history);
}
function getPerformanceHistories(history) {
    const onlyRated = history.filter((x) => x.IsRated);
    onlyRated.sort((a, b) => {
        return new Date(a.EndTime).getTime() - new Date(b.EndTime).getTime();
    });
    return onlyRated.map((x) => x.Performance);
}
function roundValue(value, numDigits) {
    return Math.round(value * Math.pow(10, numDigits)) / Math.pow(10, numDigits);
}
class EstimatorElement {
    id;
    title;
    document;
    constructor() {
        this.id = "estimator";
        this.title = "Estimator";
        this.document = dom$1;
    }
    async afterOpen() {
        const estimatorInputSelector = document.getElementById("estimator-input");
        const estimatorResultSelector = document.getElementById("estimator-res");
        let model = GetModelFromStateCode(getLS("sidemenu_estimator_state"), getLS("sidemenu_estimator_value"), getPerformanceHistories((await getHistory(userScreenName)).data));
        updateView();
        document.getElementById("estimator-toggle").addEventListener("click", () => {
            model = model.toggle();
            updateLocalStorage();
            updateView();
        });
        estimatorInputSelector.addEventListener("keyup", () => {
            updateModel();
            updateLocalStorage();
            updateView();
        });
        /** modelをinputの値に応じて更新 */
        function updateModel() {
            const inputNumber = estimatorInputSelector.valueAsNumber;
            if (!isFinite(inputNumber))
                return;
            model.updateInput(inputNumber);
        }
        /** modelの状態をLSに保存 */
        function updateLocalStorage() {
            setLS("sidemenu_estimator_value", model.inputValue);
            setLS("sidemenu_estimator_state", model.constructor.name);
        }
        /** modelを元にviewを更新 */
        function updateView() {
            const roundedInput = roundValue(model.inputValue, 2);
            const roundedResult = roundValue(model.resultValue, 2);
            document.getElementById("estimator-input-desc").innerText = model.inputDesc;
            document.getElementById("estimator-res-desc").innerText = model.resultDesc;
            estimatorInputSelector.value = String(roundedInput);
            estimatorResultSelector.value = String(roundedResult);
            const tweetStr = `AtCoderのハンドルネーム: ${userScreenName}\n${model.inputDesc}: ${roundedInput}\n${model.resultDesc}: ${roundedResult}\n`;
            document.getElementById("estimator-tweet").href = GetEmbedTweetLink(tweetStr, "https://greasyfork.org/ja/scripts/369954-ac-predictor");
        }
    }
    ;
    GetHTML() {
        return `<div class="menu-wrapper">
<div class="menu-header">
    <h4 class="sidemenu-txt">${this.title}<span class="glyphicon glyphicon-menu-up" style="float: right"></span></h4>
</div>
<div class="menu-box"><div class="menu-content" id="${this.id}">${this.document}</div></div>
</div>`;
    }
}
const estimator = new EstimatorElement();
var sidemenuHtml = "<style>\n    #menu-wrap {\n        pointer-events: none;\n        display: block;\n        position: fixed;\n        top: 0;\n        z-index: 20;\n        width: 400px;\n        right: -350px;\n        transition: all 150ms 0ms ease;\n        margin-top: 50px;\n    }\n\n    #sidemenu {\n        pointer-events: auto;\n        background: #000;\n        opacity: 0.85;\n    }\n    #sidemenu-key {\n        pointer-events: auto;\n        border-radius: 5px 0px 0px 5px;\n        background: #000;\n        opacity: 0.85;\n        color: #FFF;\n        padding: 30px 0;\n        cursor: pointer;\n        margin-top: 100px;\n        text-align: center;\n    }\n\n    #sidemenu {\n        display: inline-block;\n        width: 350px;\n        float: right;\n    }\n\n    #sidemenu-key {\n        display: inline-block;\n        width: 50px;\n        float: right;\n    }\n\n    .sidemenu-active {\n        transform: translateX(-350px);\n    }\n\n    .sidemenu-txt {\n        color: #DDD;\n    }\n\n    .menu-wrapper {\n        border-bottom: 1px solid #FFF;\n    }\n\n    .menu-header {\n        margin: 10px 20px 10px 20px;\n        user-select: none;\n    }\n\n    .menu-box {\n        overflow: hidden;\n        transition: all 300ms 0s ease;\n    }\n    .menu-box-collapse {\n        height: 0px !important;\n    }\n    .menu-box-collapse .menu-content {\n        transform: translateY(-100%);\n    }\n    .menu-content {\n        padding: 10px 20px 10px 20px;\n        transition: all 300ms 0s ease;\n    }\n    .cnvtb-fixed {\n        z-index: 19;\n    }\n</style>\n<div id=\"menu-wrap\">\n    <div id=\"sidemenu\" class=\"container\"></div>\n    <div id=\"sidemenu-key\" class=\"glyphicon glyphicon-menu-left\"></div>\n</div>";
class SideMenu {
    pendingElements;
    constructor() {
        this.pendingElements = [];
        this.Generate();
    }
    Generate() {
        document.getElementById("main-div").insertAdjacentHTML("afterbegin", sidemenuHtml);
        resizeSidemenuHeight();
        const key = document.getElementById("sidemenu-key");
        const wrap = document.getElementById("menu-wrap");
        key.addEventListener("click", () => {
            this.pendingElements.forEach((elem) => {
                elem.afterOpen();
            });
            this.pendingElements.length = 0;
            key.classList.toggle("glyphicon-menu-left");
            key.classList.toggle("glyphicon-menu-right");
            wrap.classList.toggle("sidemenu-active");
        });
        window.addEventListener("onresize", resizeSidemenuHeight);
        document.getElementById("sidemenu").addEventListener("click", (event) => {
            const target = event.target;
            const header = target.closest(".menu-header");
            if (!header)
                return;
            const box = target.closest(".menu-wrapper").querySelector(".menu-box");
            box.classList.toggle("menu-box-collapse");
            const arrow = target.querySelector(".glyphicon");
            arrow.classList.toggle("glyphicon-menu-down");
            arrow.classList.toggle("glyphicon-menu-up");
        });
        function resizeSidemenuHeight() {
            document.getElementById("sidemenu").style.height = `${window.innerHeight}px`;
        }
    }
    addElement(element) {
        const sidemenu = document.getElementById("sidemenu");
        sidemenu.insertAdjacentHTML("afterbegin", element.GetHTML());
        const content = sidemenu.querySelector(".menu-content");
        content.parentElement.style.height = `${content.offsetHeight}px`;
        // element.afterAppend();
        this.pendingElements.push(element);
    }
}
function add() {
    const sidemenu = new SideMenu();
    const elements = [estimator];
    for (let i = elements.length - 1; i >= 0; i--) {
        sidemenu.addElement(elements[i]);
    }
}

class ResultsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toPerformanceMaps() {
        const res = new Map();
        for (const result of this.data) {
            if (!result.IsRated)
                continue;
            res.set(result.UserScreenName, result.Performance);
        }
        return res;
    }
    toIsRatedMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.IsRated);
        }
        return res;
    }
    toOldRatingMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.OldRating);
        }
        return res;
    }
    toNewRatingMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.NewRating);
        }
        return res;
    }
}
const RESULTS_CACHE_DURATION = 10 * 1000;
const cache$2 = new Cache(RESULTS_CACHE_DURATION);
async function getResults(contestScreenName) {
    if (!cache$2.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/results/json`);
        if (!result.ok) {
            throw new Error(`Failed to fetch results: ${result.status}`);
        }
        cache$2.set(contestScreenName, await result.json());
    }
    return new ResultsWrapper(cache$2.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/results\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$2.set(contestScreenName, JSON.parse(content));
});

let StandingsWrapper$1 = class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            res.set(data.UserScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toIsRatedMaps(contestType) {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, this.isRated(data, contestType));
        }
        return res;
    }
    toOldRatingMaps(unpositivize = false) {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const rating = this.data.Fixed ? data.OldRating : data.Rating;
            res.set(data.UserScreenName, unpositivize ? unpositivizeRating(rating) : rating);
        }
        return res;
    }
    toCompetitionMaps() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, data.Competitions);
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType = "algorithm") {
        if (contestType === "algorithm") {
            return data.IsRated;
        }
        if (contestType === "heuristic") {
            return data.IsRated && data.TotalResult.Count !== 0;
        }
        throw new Error("unreachable");
    }
};
const STANDINGS_CACHE_DURATION$1 = 10 * 1000;
const cache$1 = new Cache(STANDINGS_CACHE_DURATION$1);
async function getStandings(contestScreenName) {
    if (!cache$1.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/json`);
        if (!result.ok) {
            throw new Error(`Failed to fetch standings: ${result.status}`);
        }
        cache$1.set(contestScreenName, await result.json());
    }
    return new StandingsWrapper$1(cache$1.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$1.set(contestScreenName, JSON.parse(content));
});

class FixedPerformanceProvider {
    result;
    constructor(result) {
        this.result = result;
    }
    availableFor(userScreenName) {
        return this.result.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`User ${userScreenName} not found`);
        }
        return this.result.get(userScreenName);
    }
    getPerformances() {
        return this.result;
    }
}

class IncrementalAlgRatingProvider {
    unpositivizedRatingMap;
    competitionsMap;
    constructor(unpositivizedRatingMap, competitionsMap) {
        this.unpositivizedRatingMap = unpositivizedRatingMap;
        this.competitionsMap = competitionsMap;
    }
    availableFor(userScreenName) {
        return this.unpositivizedRatingMap.has(userScreenName);
    }
    async getRating(userScreenName, newPerformance) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`rating not available for ${userScreenName}`);
        }
        const rating = this.unpositivizedRatingMap.get(userScreenName);
        const competitions = this.competitionsMap.get(userScreenName);
        return Math.round(positivizeRating(calcAlgRatingFromLast(rating, newPerformance, competitions)));
    }
}

class ConstRatingProvider {
    ratings;
    constructor(ratings) {
        this.ratings = ratings;
    }
    availableFor(userScreenName) {
        return this.ratings.has(userScreenName);
    }
    async getRating(userScreenName, newPerformance) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`rating not available for ${userScreenName}`);
        }
        return this.ratings.get(userScreenName);
    }
}

class FromHistoryHeuristicRatingProvider {
    newWeight;
    performancesProvider;
    constructor(newWeight, performancesProvider) {
        this.newWeight = newWeight;
        this.performancesProvider = performancesProvider;
    }
    availableFor(userScreenName) {
        return true;
    }
    async getRating(userScreenName, newPerformance) {
        const performances = await this.performancesProvider(userScreenName);
        performances.push({
            Performance: newPerformance,
            Weight: this.newWeight,
            DaysFromLatestContest: 0,
        });
        return Math.round(positivizeRating(calcHeuristicRatingFromHistory(performances)));
    }
}

class StandingsPageController {
    contestDetails;
    contestDetailsMap = new Map();
    performanceProvider;
    ratingProvider;
    oldRatings = new Map();
    isRatedMaps = new Map();
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("contest details not found");
        }
        this.contestDetails = contestDetails;
        this.contestDetailsMap = new Map(contestDetailsList.map(details => [details.contestScreenName, details]));
        if (this.contestDetails.beforeContest(new Date()))
            return;
        if (getConfig("hideDuringContest") && this.contestDetails.duringContest(new Date()))
            return;
        const standings = await getStandings(this.contestDetails.contestScreenName);
        if (getConfig("hideUntilFixed") && !standings.data.Fixed)
            return;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.ratingProvider)
                return { "type": "error", "message": "ratingProvider missing" };
            if (!this.performanceProvider)
                return { "type": "error", "message": "performanceProvider missing" };
            if (!this.isRatedMaps)
                return { "type": "error", "message": "isRatedMapping missing" };
            if (!this.oldRatings)
                return { "type": "error", "message": "oldRatings missing" };
            if (!this.oldRatings.has(userScreenName))
                return { "type": "error", "message": `oldRating not found for ${userScreenName}` };
            const oldRating = this.oldRatings.get(userScreenName);
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `performance not available for ${userScreenName}` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            if (this.isRatedMaps.get(userScreenName)) {
                if (!this.ratingProvider.provider.availableFor(userScreenName))
                    return { "type": "error", "message": `rating not available for ${userScreenName}` };
                if (this.ratingProvider.lazy) {
                    const newRatingCalculator = () => this.ratingProvider.provider.getRating(userScreenName, originalPerformance);
                    return { type: "deffered", oldRating, performance: positivizedPerformance, newRatingCalculator };
                }
                else {
                    const newRating = await this.ratingProvider.provider.getRating(userScreenName, originalPerformance);
                    return { type: "rated", oldRating, performance: positivizedPerformance, newRating };
                }
            }
            else {
                return { type: "unrated", oldRating, performance: positivizedPerformance };
            }
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("contestDetails missing");
        if (isDebugMode())
            console.log("data updating...");
        const standings = await getStandings(this.contestDetails.contestScreenName);
        let basePerformanceProvider = undefined;
        if (standings.data.Fixed && getConfig("useResults")) {
            try {
                const results = await getResults(this.contestDetails.contestScreenName);
                if (results.data.length === 0) {
                    throw new Error("results missing");
                }
                basePerformanceProvider = new FixedPerformanceProvider(results.toPerformanceMaps());
                this.isRatedMaps = results.toIsRatedMaps();
                this.oldRatings = results.toOldRatingMaps();
                this.ratingProvider = { provider: new ConstRatingProvider(results.toNewRatingMaps()), lazy: false };
            }
            catch (e) {
                console.warn("getResults failed", e);
            }
        }
        if (basePerformanceProvider === undefined) {
            const aperfsDict = await getAPerfs(this.contestDetails.contestScreenName);
            const defaultAPerf = this.contestDetails.defaultAPerf;
            const normalizedRanks = normalizeRank(standings.toRanks(true, this.contestDetails.contestType));
            const aperfsList = standings.toRatedUsers(this.contestDetails.contestType).map(user => hasOwnProperty(aperfsDict, user) ? aperfsDict[user] : defaultAPerf);
            basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
            this.isRatedMaps = standings.toIsRatedMaps(this.contestDetails.contestType);
            this.oldRatings = standings.toOldRatingMaps();
            if (getConfig("compareComputations")) {
                const results = await getResults(this.contestDetails.contestScreenName);
                this.performanceProvider = basePerformanceProvider;
                this.oldRatings = results.toPerformanceMaps();
                this.ratingProvider = { provider: { availableFor: (name) => basePerformanceProvider.availableFor(name), getRating: async (name, _v) => basePerformanceProvider.getPerformance(name) }, lazy: false };
                return;
            }
            if (this.contestDetails.contestType == "algorithm") {
                this.ratingProvider = { provider: new IncrementalAlgRatingProvider(standings.toOldRatingMaps(true), standings.toCompetitionMaps()), lazy: false };
            }
            else {
                const startAt = this.contestDetails.startTime;
                const endAt = this.contestDetails.endTime;
                this.ratingProvider = {
                    provider: new FromHistoryHeuristicRatingProvider(getWeight(startAt, endAt), async (userScreenName) => {
                        const histories = await getHistory(userScreenName, "heuristic");
                        histories.data = histories.data.filter(x => new Date(x.EndTime) < endAt);
                        return histories.toRatingMaterials(endAt, x => {
                            const details = this.contestDetailsMap.get(x.split(".")[0]);
                            if (!details) {
                                console.warn(`contest details not found for ${x}`);
                                return 0;
                            }
                            return details.duration;
                        });
                    }),
                    lazy: true
                };
            }
        }
        this.performanceProvider = new InterpolatePerformanceProvider(standings.toRanks(), basePerformanceProvider);
        if (isDebugMode())
            console.log("data updated");
    }
}

class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            const userScreenName = data.Additional["standings.virtualElapsed"] === -2 ? `ghost:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const userScreenName = data.Additional["standings.virtualElapsed"] === -2 ? `ghost:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType) {
        if (contestType === "algorithm") {
            return data.IsRated && data.Additional["standings.virtualElapsed"] === -2;
        }
        else {
            return data.IsRated && data.Additional["standings.virtualElapsed"] === -2 && data.TotalResult.Count !== 0;
        }
    }
}
function createCacheKey(contestScreenName, showGhost) {
    return `${contestScreenName}:${showGhost}`;
}
const STANDINGS_CACHE_DURATION = 10 * 1000;
const cache = new Cache(STANDINGS_CACHE_DURATION);
async function getVirtualStandings(contestScreenName, showGhost) {
    const cacheKey = createCacheKey(contestScreenName, showGhost);
    if (!cache.has(cacheKey)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/virtual/json${showGhost ? "?showGhost=true" : ""}`);
        if (!result.ok) {
            throw new Error(`Failed to fetch standings: ${result.status}`);
        }
        cache.set(cacheKey, await result.json());
    }
    return new StandingsWrapper(cache.get(cacheKey));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/virtual\/json(\?showGhost=true)?$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    const showGhost = match[2] != "";
    cache.set(createCacheKey(contestScreenName, showGhost), JSON.parse(content));
});

function isVirtualStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/virtual\/?$/.test(document.location.pathname);
}

function duringVirtualParticipation() {
    if (!isVirtualStandingsPage()) {
        throw new Error("not available in this page");
    }
    const timerText = document.getElementById("virtual-timer")?.textContent ?? "";
    if (timerText && !timerText.includes("終了") && !timerText.includes("over"))
        return true;
    else
        return false;
}

function forgeCombinedRanks(a, b) {
    const res = new Map();
    const merged = [...a.entries(), ...b.entries()].sort((a, b) => a[1].score !== b[1].score ? b[1].score - a[1].score : a[1].penalty - b[1].penalty);
    let rank = 0;
    let prevScore = NaN;
    let prevPenalty = NaN;
    for (const [userScreenName, { score, penalty }] of merged) {
        if (score !== prevScore || penalty !== prevPenalty) {
            rank++;
            prevScore = score;
            prevPenalty = penalty;
        }
        res.set(userScreenName, rank);
    }
    return res;
}
function remapKey(map, mappingFunction) {
    const newMap = new Map();
    for (const [key, val] of map) {
        newMap.set(mappingFunction(key), val);
    }
    return newMap;
}
class VirtualStandingsPageController {
    contestDetails;
    performanceProvider;
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("contest details not found");
        }
        this.contestDetails = contestDetails;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.performanceProvider)
                return { "type": "error", "message": "performanceProvider missing" };
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `performance not available for ${userScreenName}` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            return { type: "perfonly", performance: positivizedPerformance };
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("contestDetails missing");
        const virtualStandings = await getVirtualStandings(this.contestDetails.contestScreenName, true);
        const results = await getResults(this.contestDetails.contestScreenName);
        let ranks;
        let basePerformanceProvider;
        if ((!duringVirtualParticipation() || getConfig("useFinalResultOnVirtual")) && getConfig("useResults")) {
            const standings = await getStandings(this.contestDetails.contestScreenName);
            const referencePerformanceMap = remapKey(results.toPerformanceMaps(), userScreenName => `reference:${userScreenName}`);
            basePerformanceProvider = new FixedPerformanceProvider(referencePerformanceMap);
            ranks = forgeCombinedRanks(remapKey(standings.toScores(), userScreenName => `reference:${userScreenName}`), virtualStandings.toScores());
        }
        else {
            const aperfsObj = await getAPerfs(this.contestDetails.contestScreenName);
            const defaultAPerf = this.contestDetails.defaultAPerf;
            const normalizedRanks = normalizeRank(virtualStandings.toRanks(true, this.contestDetails.contestType));
            const aperfsList = virtualStandings.toRatedUsers(this.contestDetails.contestType).map(userScreenName => hasOwnProperty(aperfsObj, userScreenName) ? aperfsObj[userScreenName] : defaultAPerf);
            basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
            ranks = virtualStandings.toRanks();
        }
        this.performanceProvider = new InterpolatePerformanceProvider(ranks, basePerformanceProvider);
    }
}

function isExtendedStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/extended\/?$/.test(document.location.pathname);
}

function isStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/?$/.test(document.location.pathname);
}

{
    const controller = new ConfigController();
    controller.register();
    add();
}
if (isStandingsPage()) {
    const controller = new StandingsPageController();
    controller.register();
}
if (isVirtualStandingsPage()) {
    const controller = new VirtualStandingsPageController();
    controller.register();
}
if (isExtendedStandingsPage()) {
    const controller = new ExtendedStandingsPageController();
    controller.register();
}
    })();
    //AtcoderColorStandings
    (function(){
  if (!/\/standings(\/|$)/.test(location.pathname)) return;
  // RGBからカラーコードに変換する
  function rgb2hex ( rgb ) {
    return "#" + rgb.map( function ( value ) {
      return ( "0" + value.toString( 16 ) ).slice( -2 ) ;
    }).join( "" ) ;
  }

  // 詳細か否か
  let detailmode = 0;
  // Ratedのみを集めるか否か
  let ratedmode = 0;
  // 1回以上提出を集めるか否か
  let submitmode = 1;

  // 表を先頭に追加
  $("#vue-standings").prepend(`<div><button class="btn btn-default" id="colorstanding-detail">詳細に切り替え</button><button class="btn btn-default" id="colorstanding-rated">Unratedも表示中</button><button class="btn btn-default" id="colorstanding-submit">1回以上提出を表示中</button><button class="btn btn-default" id="colorstanding-off">非表示</button><table id="accs-table" class="table table-bordered table-hover th-center td-middle"><thead></thead><tbody></tbody></table></div>`);

  // 表の更新
  function update () {
    vueStandings.$watch("standings", function (new_val, old_val) {
      if (detailmode == 1) {
        $("#colorstanding-detail").empty();
        $("#colorstanding-detail").append(`詳細表示中`);
      } else {
        $("#colorstanding-detail").empty();
        $("#colorstanding-detail").append(`詳細に切り替え`);
      }
      if (ratedmode == 1) {
        $("#colorstanding-rated").empty();
        $("#colorstanding-rated").append(`Ratedのみを表示中`);
      } else {
        $("#colorstanding-rated").empty();
        $("#colorstanding-rated").append(`Unratedも表示中`);
      }
      if (submitmode == 1) {
        $("#colorstanding-submit").empty();
        $("#colorstanding-submit").append(`1回以上提出を表示中`);
      } else {
        $("#colorstanding-submit").empty();
        $("#colorstanding-submit").append(`提出なしも表示中`);
      }
      if (!new_val) {
        return;
      }
      let task = new_val.TaskInfo;
      let data = new_val.StandingsData;

      let ratecolor = ["#000000", "#666666", "#663300", "#006600", "#009999", "#0000cc", "#cc9900", "#ff9900", "#ff3333"];
      let ratename = ["黒", "灰", "茶", "緑", "水", "青", "黄", "橙", "赤"]
      let ratelist = [1, 400, 800, 1200, 1600, 2000, 2400, 2800, 9999];

      if (detailmode == 1){
        ratelist = [1, 33, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 9999];
        ratename = ["0", "1", "33", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000", "2100", "2200", "2300", "2400", "2500", "2600", "2700", "2800", "2900", "3000", "3100", "3200", "3300", "3400", "3500", "金"];
        ratecolor = ["#000000", "#666666", "#666666", "#666666", "#666666", "#666666", "#663300", "#663300", "#663300", "#663300", "#006600", "#006600", "#006600", "#006600", "#009999", "#009999", "#009999", "#009999", "#0000cc", "#0000cc", "#0000cc", "#0000cc", "#cc9900", "#cc9900", "#cc9900", "#cc9900", "#ff9900", "#ff9900", "#ff9900", "#ff9900", "#ff3333", "#ff3333", "#ff3333", "#ff3333", "#990000", "#990000", "#990000", "#990000", "#461900"];
      }

      // コンテスト前とコンテスト後ではjsonの挙動が違う
      let ratingmode = 0;
      for (let cnt = 0; cnt < data.length; cnt++) {
        if (data[cnt]["TotalResult"]["Count"] >= 1) {
          if (data[cnt]["OldRating"] > 0) {
            ratingmode = 1;
            break;
          }
        }
      }

      let nowrating = "Rating";
      if (ratingmode == 1) {
        nowrating = "OldRating"
      }

      // 参加者一覧の表を作る
      let contestant = [];
      for (let i = 0; i < ratelist.length; i++) {
        contestant.push([]);
      }

      // 参加者カウント
      for (let cnt = 0; cnt < data.length; cnt++) {
        for (let color = 0; color < ratelist.length; color++){
          if (data[cnt]["IsRated"] == true || ratedmode == 0) {
            if (data[cnt]["TotalResult"]["Count"] >= 1 || submitmode == 0) {
              if (data[cnt][nowrating] < ratelist[color]) {
                contestant[color].push(cnt);
                break;
              }
            }
          }
        }
      }

       // 配列の用意
      var colordata = [];
      for (let i = 0; i < task.length; i++) {
        colordata.push([]);
        for (let j = 0; j < ratelist.length; j++) {
          colordata[i].push(0);
        }
      }
      var colornum = [];
      for (let i = 0; i < ratelist.length; i++) {
        colornum[i] = contestant[i].length;
      }

      // 色別の正解数を取得
      for (let colors = 0; colors < contestant.length; colors++) {
        for (let cnt = 0; cnt < task.length; cnt++) {
          let probid = task[cnt].TaskScreenName;
          for (let player = 0; player < contestant[colors].length; player++) {
            try {
              if (data[contestant[colors][player]]["TaskResults"][probid]["Status"] === 1) {
                colordata[cnt][colors] += 1;
              }
            } catch {
              null;
            }
          }
        }
      }

      // 表の先頭
      let t = `<tr style="font-weight: bold;"><td align="center">Rate</td><td align="center">参加者数</td>`;
      for (let i = 0; i < task.length; i++) {
        t += `<td align="center">` + task[i].Assignment + `</td>`;
      }
      t += `</tr>`;

      // 表の途中
      for (let colors = 0; colors < ratecolor.length; colors++) {
        t += `<tr><td align="center" style="padding: 2px;"><font color="` + ratecolor[colors] + `"><b>` + ratename[colors] + `</b></td><td align="right">` + colornum[colors] + `</td>`;
        for (let i = 0; i < task.length; i++) {
          // 正解率を求める
          let dat = 0;
          if (colornum[colors] != 0) {
            dat = colordata[i][colors] / colornum[colors];
          }
          // 正解率によって背景色を定める
          let targ = 0;
          let cr = 0;
          let cg = 0;
          let cb = 0;
          if (dat >= 0.9) {
            targ = (1-dat)*1000;
            cr = Math.floor(255-targ);
            cg = 255;
            cb = Math.floor(155+targ);
          } else if (dat >= 0.75) {
            targ = (0.9-dat)/1.5*1000;
            cr = 155;
            cg = 255;
            cb = Math.floor(255-targ);
          } else if (dat >= 0.5) {
            targ = (0.75-dat)/2.5*1000;
            cr = Math.floor(155+targ);
            cg = Math.floor(255-targ*0.5);
            cb = 155;
          } else if (dat >= 0.25) {
            targ = (0.5-dat)/2.5*1000;
            cr = Math.floor(255-targ*0.5);
            cg = 205;
            cb = Math.floor(155+targ*0.5);
          } else if (dat >= 0.05) {
            targ = (0.25-dat)/2*1000;
            cr = Math.floor(205-targ*0.5);
            cg = Math.floor(205-targ*0.5);
            cb = Math.floor(205-targ*0.5);
          } else {
            targ = (0.05-dat)/0.5*1000;
            cr = Math.floor(155-targ*0.2);
            cg = Math.floor(155-targ*0.2);
            cb = Math.floor(155-targ*0.2);
          }
          t += `<td align="right" bgcolor="` + rgb2hex( [cr, cg, cb] ) + `">` + (dat*100).toFixed(2) + `%</td>`;
        }
        t += `</tr>`;
      }

      $("#accs-table > tbody").empty();
      $("#accs-table > tbody").append(t);
    }, { deep: true, immediate: true });
  }

  update();
  document.getElementById("colorstanding-detail").addEventListener("click", () => {
    detailmode = 1 - detailmode
    update();
  });
  document.getElementById("colorstanding-rated").addEventListener("click", () => {
    ratedmode = 1 - ratedmode
    update();
  });
  document.getElementById("colorstanding-submit").addEventListener("click", () => {
    submitmode = 1 - submitmode
    update();
  });
  document.getElementById("colorstanding-off").addEventListener("click", () => {
    $("#accs-table > tbody").empty();
  });
    })();
    //AtcoderStandingsAnalysis
    (function(){
if (!/\/standings(\/|$)/.test(location.pathname)) return;
// ソート済み配列のうちval未満が何個あるか求める
function countLower(arr, val) {
  var lo = -1;
  var hi = arr.length;
  while (hi - lo > 1) {
    var mid = Math.floor((hi + lo) / 2);
    if (arr[mid] < val) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return hi;
}

// 換算: Rating -> innerRating
function innerRating(rate, comp) {
  var ret = rate;
  if (rate <= 0) {
    throw "rate <= 0";
  }
  if (ret < 400) {
    ret = 400 * (1 - Math.log(400 / rate));
  }
  ret += 1200 * (Math.sqrt(1 - Math.pow(0.81, comp)) / (1 - Math.pow(0.9, comp)) - 1) / (Math.sqrt(19) - 1);
  return ret;
}

$(function () {
  'use strict';

  const cols = ["#808080", "#804000", "#008000", "#00C0C0", "#0000FF", "#C0C000", "#FF8000", "#FF0000"];
  const threshold = [-10000, 400, 800, 1200, 1600, 2000, 2400, 2800];
  const canvasWidth = 250;
  const canvasHeight = 25;

  // 表を先頭に追加
  $('#vue-standings').prepend(`
<div>
  <table id="acsa-table" class="table table-bordered table-hover th-center td-center td-middle">
    <thead>
    </thead>
    <tbody>
    </tbody>
  </table>
</div>
  `);

  // 表の更新
  vueStandings.$watch('standings', function (newVal, oldVal) {
    if (!newVal) {
      return;
    }
    var data;
    var task = newVal.TaskInfo;
    if (vueStandings.filtered) {
      data = vueStandings.filteredStandings;
    } else {
      data = newVal.StandingsData;
    }

    $('#acsa-table > tbody').empty();
    $('#acsa-table > tbody').append(`
<tr style="font-weight: bold;">
  <td>問題</td>
  <td>得点</td>
  <td>人数</td>
  <td>正解率</td>
  <td>平均ペナ</td>
  <td>ペナ率</td>
  <td>内部レート</td>
</tr>
    `);
    for (let i = 0; i < task.length; i++) {
      var isTried = vueStandings.tries[i] > 0;
      $('#acsa-table > tbody').append(`
<tr>
  <td style="padding: 4px;">` + task[i].Assignment + `</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px;">` + vueStandings.ac[i] + ` / ` + vueStandings.tries[i] + `</td>
  <td style="padding: 4px;">` + (isTried ? (vueStandings.ac[i] / vueStandings.tries[i] * 100).toFixed(2) + "%" : "-") + `</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px; width: ` + canvasWidth + `px;"><canvas style="vertical-align: middle;" width="` + canvasWidth + `px" height="` + canvasHeight +`px"></canvas></td>
</tr>
      `);
      if (!isTried) {
        continue;
      }

      // トップの得点を満点とみなす
      var maxScore = -1;
      var myScore = -1;
      // 不正解数 / 提出者数
      var avePenalty = 0;
      // ペナルティ >= 1 の人数 / 提出者数
      var ratioPenalty = 0;
      var rates = [];
      for (let j = 0; j < data.length; j++) {
        // 参加登録していない
        if (!data[j].TaskResults) {
          continue;
        }
        // アカウント削除
        if (data[j].UserIsDeleted) {
          continue;
        }
        var result = data[j].TaskResults[task[i].TaskScreenName];
        // 未提出のときresult === undefined
        if (result) {
          if (data[j].UserScreenName === vueStandings.userScreenName) {
            myScore = result.Score;
          }
          // 赤い括弧内の数字
          var penalty = result.Score === 0 ? result.Failure : result.Penalty;
          avePenalty += penalty;
          if (penalty > 0) {
            ratioPenalty++;
          }
          if (maxScore < result.Score) {
            maxScore = result.Score;
          }
        }
      }
      // 正解者の内部レート配列を作成する
      // 初出場はカウントしない
      if (maxScore > 0) {
        for (let j = 0; j < data.length; j++) {
          if (data[j].Competitions > 0
          &&  data[j].TaskResults[task[i].TaskScreenName]
          &&  data[j].TaskResults[task[i].TaskScreenName].Score === maxScore) {
            rates.push(innerRating(Math.max(data[j].Rating, 1), data[j].Competitions));
          }
        }
        rates.sort(function (a, b) { return a - b; });
      }

      myScore /= 100;
      maxScore /= 100;
      avePenalty /= vueStandings.tries[i];
      ratioPenalty /= vueStandings.tries[i];
      ratioPenalty *= 100;

      $('#acsa-table > tbody > tr:eq(' + (i+1) + ') > td:eq(1)').text(myScore >= 0 ? myScore.toFixed() : "-");
      $('#acsa-table > tbody > tr:eq(' + (i+1) + ') > td:eq(4)').text(avePenalty.toFixed(2));
      $('#acsa-table > tbody > tr:eq(' + (i+1) + ') > td:eq(5)').text(ratioPenalty.toFixed(2) + "%");
      if (maxScore > 0) {
        var canvas = $('#acsa-table > tbody > tr:eq(' + (i+1) + ') > td:eq(6) > canvas')[0];
        if (canvas.getContext) {
          var context = canvas.getContext('2d');
          for (let k = 0; k < 8; k++) {
            context.fillStyle = cols[k];
            // 色の境界から右端までの矩形描画
            var x = Math.round(countLower(rates, threshold[k]) / rates.length * canvasWidth);
            context.fillRect(x, 0, canvasWidth - x, canvasHeight);
          }
        }
      }
    }
  }, {deep: true, immediate: true})
});
    })();
})();