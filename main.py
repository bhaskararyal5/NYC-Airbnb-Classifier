from fastapi import FastAPI 
import pandas as pd
from pydantic import BaseModel,Field
import joblib

app = FastAPI()

Columns = ['neighbourhood_group', 'neighbourhood', 'latitude', 'longitude',
       'price', 'minimum_nights', 'number_of_reviews',
       'reviews_per_month', 'calculated_host_listings_count',
       'availability_365']

model = joblib.load("model_nyc_airbnb.pkl")
#Pydantic model to check input or to validate input
class Features(BaseModel):
    neighbourhood_group             : str = Field(...,min_length=1)
    neighbourhood                   : str = Field(...,min_length=1)
    latitude                        : float = Field(...,gt=-90,le=90)
    longitude                       : float = Field(...,gt=-180,le=180)                       
    price                           : float = Field(...,gt=0)
    minimum_nights                  : int   = Field(...,gt=0)
    number_of_reviews               : int   = Field(...,gt=0)
    reviews_per_month               : float   = Field(...,gt=0)
    calculated_host_listings_count  : int   = Field(...,gt=0)
    availability_365                : int   = Field(...,gt=0,le=365)

 

@app.get('/')
def greet():
    return "hello guys"
@app.post("/predict")
def predict(features : Features):
    row =pd.DataFrame([features.dict()], columns=Columns )
    prediction = model.predict(row)
    probability = model.predict_proba(row)
    return {
        "Predicted_room_type":prediction[0],
        "Probability":probability[0].tolist()
    }