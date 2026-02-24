from pydantic import BaseModel


class AboutContentResponse(BaseModel):
    section_key: str
    title: str
    body: str
    image_url: str | None
