from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class ProviderName(str, enum.Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GEMINI = "gemini"
    MISTRAL = "mistral"
    COHERE = "cohere"
    GROQ = "groq"


class APIProvider(Base):
    __tablename__ = "api_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    provider = Column(SAEnum(ProviderName), nullable=False)
    label = Column(String(100), nullable=True)        # user's custom label
    encrypted_key = Column(Text, nullable=False)      # encrypted API key
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)       # default provider

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="api_providers")

    def __repr__(self):
        return f"<APIProvider {self.provider} ({self.label})>"
