from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class PipelineTemplate(Base):
    __tablename__ = "pipeline_templates"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    operations  = Column(JSON, nullable=False, default=list)
    is_public   = Column(Boolean, default=False)
    use_count   = Column(Integer, default=0)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<PipelineTemplate {self.name}>"
