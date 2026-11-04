<div align="center">

# 🏙️ NYC Airbnb Room Type Classifier

**Predict whether an NYC Airbnb listing is an entire home, a private room, or a shared room.**
A scikit-learn Random Forest, served by FastAPI, with an animated skyline web UI.

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.7.2-F7931E?logo=scikitlearn&logoColor=white)
![HTML/CSS/JS](https://img.shields.io/badge/Frontend-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-E34F26?logo=html5&logoColor=white)

<!-- Add a screenshot or GIF of the UI here:
<img src="docs/screenshot.png" alt="App screenshot" width="820"> -->

</div>

---

## ✨ Overview

This project trains a multi-class classifier on the public **[New York City Airbnb Open Data (2019)](https://www.kaggle.com/datasets/dgomonov/new-york-city-airbnb-open-data)** dataset (48,895 listings). Given a listing's location, price and activity stats, it predicts the `room_type` along with a probability for each class.

It has three parts:

| Part | What it does |
|---|---|
| **Notebook** | Cleaning, EDA, model comparison, hyperparameter tuning, and export of the trained pipeline |
| **API** | A FastAPI service that validates input and returns a prediction and class probabilities |
| **Web UI** | A static HTML/CSS/JS page where the skyline's windows light up as you fill in the form, then shows the result as an animated donut chart |

## 🔎 How the model works

**Target:** `room_type` → `Entire home/apt`, `Private room`, `Shared room` (imbalanced, with shared rooms a small minority)

**Features (10):**

| Type | Columns |
|---|---|
| Categorical | `neighbourhood_group`, `neighbourhood` |
| Location | `latitude`, `longitude` |
| Numeric | `price`, `minimum_nights`, `number_of_reviews`, `reviews_per_month`, `calculated_host_listings_count`, `availability_365` |

**Preprocessing**
- Dropped identifier and free-text columns: `id`, `name`, `host_id`, `host_name`, `last_review`
- Filled missing `reviews_per_month` with `0` (no reviews yet)
- Capped outliers at the 99th percentile (`price`, `minimum_nights`) instead of deleting rows
- Numeric: median imputation → `StandardScaler`
- Categorical: imputation → `OneHotEncoder` (231 features after encoding)
- Stratified 70/30 train/test split, so class proportions are preserved

**Model selection** (3-fold cross-validation on the training set; `class_weight="balanced"` where supported):

| Model | Accuracy | Macro F1 |
|---|---|---|
| Logistic Regression | 0.658 | 0.522 |
| Decision Tree | 0.786 | 0.651 |
| **Random Forest** | **0.852** | **0.711** |
| Gradient Boosting | 0.849 | 0.705 |

Random Forest was tuned with `RandomizedSearchCV` (10 iterations, 3-fold, scored on macro F1, so the minority class matters). The saved model uses `n_estimators=200`, `max_depth=None`, `min_samples_split=10`, `class_weight="balanced"`. The notebook also reports accuracy, macro F1 and a confusion matrix on the held-out test set.

## 📁 Project structure

```
NYC-Airbnb-Classifier/
├── AB_NYC_2019.csv         # Dataset
├── NYC-model.ipynb         # EDA, training, evaluation, export
├── model_nyc_airbnb.pkl    # Trained scikit-learn pipeline (preprocessing + Random Forest)
├── main.py                 # FastAPI app
├── requirements.txt        # Python dependencies
├── index.html              # Web UI
├── style.css
└── script.js
```

## 🚀 Getting started

### 1. Clone and install

```bash
git clone https://github.com/bhaskararyal5/NYC-Airbnb-Classifier.git
cd NYC-Airbnb-Classifier

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

> `scikit-learn` is pinned to **1.7.2**, the version the model was saved with. A different version may give warnings or unreliable predictions.

### 2. Enable CORS

The web page and the API run on different origins, so `main.py` must allow cross-origin requests. Add this after `app = FastAPI()`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # restrict to your frontend's origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Start the API

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`, and interactive docs are at `http://127.0.0.1:8000/docs`.

### 4. Open the UI

Open `index.html` in your browser, or serve the folder:

```bash
python -m http.server 5500       # then visit http://localhost:5500
```

The small box at the top right of the page shows the API address and a status dot (green = reachable). Change it there, or edit `DEFAULT_API` at the top of `script.js`. The address is saved in `localStorage`.

## 🔌 API reference

### `GET /`
Health check. Returns a greeting string.

### `POST /predict`

**Request body**

| Field | Type | Rule |
|---|---|---|
| `neighbourhood_group` | string | non-empty (Manhattan, Brooklyn, Queens, Bronx, Staten Island) |
| `neighbourhood` | string | non-empty |
| `latitude` | float | > -90 and ≤ 90 |
| `longitude` | float | > -180 and ≤ 180 |
| `price` | float | > 0 |
| `minimum_nights` | int | > 0 |
| `number_of_reviews` | int | > 0 |
| `reviews_per_month` | float | > 0 |
| `calculated_host_listings_count` | int | > 0 |
| `availability_365` | int | > 0 and ≤ 365 |

**Example**

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "neighbourhood_group": "Brooklyn",
    "neighbourhood": "Williamsburg",
    "latitude": 40.7081,
    "longitude": -73.9571,
    "price": 140,
    "minimum_nights": 3,
    "number_of_reviews": 48,
    "reviews_per_month": 1.6,
    "calculated_host_listings_count": 1,
    "availability_365": 210
  }'
```

**Response** (values shown are illustrative)

```json
{
  "Predicted_room_type": "Private room",
  "Probability": [0.12, 0.85, 0.03]
}
```

`Probability` follows the model's class order: `["Entire home/apt", "Private room", "Shared room"]`.

Invalid input returns a `422` response describing which field failed validation, and the UI shows that message.

## ⚠️ Notes and limitations

- **No zero values:** the API validation uses `gt=0`, so values like `0` reviews are rejected. Change these to `ge=0` in `main.py` (and in the UI's `validate()`) if you want to allow brand-new listings.
- **Neighbourhood names** should match the dataset's spelling. Names the encoder never saw during training carry no learned signal.
- **Data is from 2019.** Prices and listing patterns have changed since, so predictions reflect that period.
- **Class imbalance:** shared rooms are rare, so expect lower accuracy for that class than for the other two.
- **Security:** `allow_origins=["*"]` is convenient for development only. Also, a `.pkl` file can run code when loaded, so only load model files you trust.

## 🛠️ Tech stack

Python · pandas · NumPy · scikit-learn · joblib · FastAPI · Pydantic · Uvicorn · HTML · CSS · JavaScript

## 🗺️ Ideas for next steps

- [ ] Deploy the API (Render, Railway, Fly.io) and point `DEFAULT_API` at it
- [ ] Return class names with the probabilities so the UI doesn't depend on class order
- [ ] Add a Dockerfile and a GitHub Actions workflow
- [ ] Try SMOTE or threshold tuning for the shared-room class
- [ ] Add unit tests for the API validation

## 🙏 Acknowledgements

Dataset: [New York City Airbnb Open Data](https://www.kaggle.com/datasets/dgomonov/new-york-city-airbnb-open-data) on Kaggle.

## 📄 License

Add a license (for example MIT) and state it here.

---

<div align="center">Built by <a href="https://github.com/bhaskararyal5">@bhaskararyal5</a></div>
