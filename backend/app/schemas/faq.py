from pydantic import BaseModel


class FaqItemResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str
