from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from app.db.session import Base


class SchemaRule(Base):
    __tablename__ = "schema_rules"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    rules       = Column(JSON, nullable=False, default=list)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SchemaRule {self.name}>"
