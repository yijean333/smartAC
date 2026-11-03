
// =====================================
// SmartAC 智慧冷氣環境管家
// ESP32 + PHP + MySQL
// =====================================

// 1. 取得 HTML 元素
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const tvocEl = document.getElementById("tvoc");
const sensorStatusEl = document.getElementById("sensorStatus");
const lastUpdateEl = document.getElementById("lastUpdate");

const historyEl = document.getElementById("history");
const odorHistoryEl = document.getElementById("odorHistory");

const saveBtn = document.getElementById("saveBtn");
const odorBtn = document.getElementById("odorBtn");

// 最新的真實感測資料
let latestReading = null;


// =====================================
// 2. 取得最新感測數據
// =====================================

async function updateSensor() {
    try {
        const response = await fetch("get_latest.php", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("取得感測資料失敗");
        }

        const data = await response.json();

        if (!data) {
            latestReading = null;
            sensorStatusEl.textContent = "目前沒有感測資料";
            return;
        }

        const temperature = Number(data.temperature);
        const humidity = Number(data.humidity);
        const tvoc = data.tvoc === null
            ? null
            : Number(data.tvoc);

        if (
            !Number.isFinite(temperature) ||
            !Number.isFinite(humidity) ||
            (tvoc !== null && !Number.isFinite(tvoc))
        ) {
            throw new Error("感測資料格式錯誤");
        }

        latestReading = {
            id: Number(data.id),
            temperature: temperature,
            humidity: humidity,
            tvoc: tvoc,
            recorded_at: data.recorded_at
        };

        // 更新畫面
        temperatureEl.textContent = temperature.toFixed(2);
        humidityEl.textContent = humidity.toFixed(2);
        tvocEl.textContent = tvoc ?? "--";

        lastUpdateEl.textContent = data.recorded_at;

        // 判斷資料是否過期
        const recordedTime = new Date(
            data.recorded_at.replace(" ", "T")
        );

        const age = Date.now() - recordedTime.getTime();

        if (Number.isNaN(age) || age < -60000) {
            sensorStatusEl.textContent = "無法確認資料更新狀態";
        } else if (age > 30000) {
            sensorStatusEl.textContent = "感測資料已超過 30 秒未更新";
        } else {
            sensorStatusEl.textContent = "ESP32 感測資料正常更新";
        }

    } catch (error) {
        console.error(error);
        sensorStatusEl.textContent = "無法連接感測資料 API";
    }
}


// =====================================
// 3. 讀取歷史感測紀錄
// =====================================

async function getReadings() {
    try {
        const response = await fetch("get_readings.php", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("讀取感測紀錄失敗");
        }

        const records = await response.json();

        historyEl.replaceChildren();

        if (records.length === 0) {
            historyEl.textContent = "目前沒有感測紀錄";
            return;
        }

        records.forEach(record => {
            const li = document.createElement("li");

            li.textContent =
                `${record.recorded_at} | ` +
                `溫度：${record.temperature}°C | ` +
                `濕度：${record.humidity}% | ` +
                `TVOC：${record.tvoc ?? "--"} ppb`;

            historyEl.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        historyEl.textContent = "無法讀取歷史感測紀錄";
    }
}


// =====================================
// 4. 儲存異味回報
// =====================================

async function saveOdorReport() {
    odorBtn.disabled = true;

    try {
        // 先取得最新資料，避免使用過期的感測紀錄
        await updateSensor();

        if (!latestReading) {
            throw new Error("目前沒有可用的感測資料");
        }

        const recordedTime = new Date(
            latestReading.recorded_at.replace(" ", "T")
        );

        const age = Date.now() - recordedTime.getTime();

        if (
            !Number.isFinite(age) ||
            age > 30000 ||
            age < -60000
        ) {
            throw new Error("感測資料已過期，無法儲存異味回報");
        }

        const odor = document.getElementById("odor").value;

        const response = await fetch("save_odor.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                reading_id: latestReading.id,
                has_odor: odor === "yes"
            })
        });

        if (!response.ok) {
            throw new Error("異味回報儲存失敗");
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error("異味回報儲存失敗");
        }

        alert("異味回報儲存成功！");

        await getOdorReports();

    } catch (error) {
        console.error(error);
        alert(error.message);

    } finally {
        odorBtn.disabled = false;
    }
}


// =====================================
// 5. 讀取歷史異味回報
// =====================================

async function getOdorReports() {
    try {
        const response = await fetch("get_odor.php", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("讀取異味紀錄失敗");
        }

        const records = await response.json();

        odorHistoryEl.replaceChildren();

        if (records.length === 0) {
            odorHistoryEl.textContent = "目前沒有異味回報紀錄";
            return;
        }

        records.forEach(record => {
            const li = document.createElement("li");

            const odorText =
                Number(record.has_odor) === 1
                    ? "有霉味"
                    : "沒有霉味";

            li.textContent =
                `${record.reported_at} | ` +
                `溫度：${record.temperature}°C | ` +
                `濕度：${record.humidity}% | ` +
                `TVOC：${record.tvoc ?? "--"} ppb | ` +
                odorText;

            odorHistoryEl.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        odorHistoryEl.textContent = "無法讀取歷史異味紀錄";
    }
}


// =====================================
// 6. 手動刷新最新感測紀錄
// =====================================

// 現在 ESP32 已經會自動儲存資料。
// 原本的 saveBtn 不再送出重複感測資料，
// 改成手動刷新歷史紀錄。

saveBtn.textContent = "更新感測紀錄";

saveBtn.addEventListener("click", async () => {
    await updateSensor();
    await getReadings();
});

odorBtn.addEventListener("click", saveOdorReport);

document.getElementById("refreshBtn")
    .addEventListener("click", getReadings);

document.getElementById("refreshOdorBtn")
    .addEventListener("click", getOdorReports);


// =====================================
// 7. 初始化
// =====================================

updateSensor();
getReadings();
getOdorReports();

// 每 3 秒取得最新感測資料
setInterval(updateSensor, 3000);

// 每 10 秒更新歷史感測紀錄
setInterval(getReadings, 10000);

// 每 10 秒更新異味紀錄
setInterval(getOdorReports, 10000);
