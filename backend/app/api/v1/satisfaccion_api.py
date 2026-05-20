import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.satisfaccion import EncuestaSatisfaccion, PreguntaEncuesta
from app.schemas.satisfaccion import (
    EncuestaSatisfaccionCreate,
    EncuestaSatisfaccionResponse,
    EncuestaResponder
)

router = APIRouter()

def compute_survey_metrics(encuesta: EncuestaSatisfaccion) -> Dict[str, Any]:
    """Helper to compute NPS and CSAT scores dynamically from survey questions."""
    ratings = [p.calificacion for p in encuesta.preguntas if p.calificacion is not None]
    if not ratings:
        return {"nps_score": 0, "csat_score": 0.0}
    
    # CSAT = (Average rating / 10) * 100 => Average rating * 10
    csat = sum(ratings) / len(ratings) * 10
    
    # NPS = % Promotores (9-10) - % Detractores (1-6)
    promoters = sum(1 for r in ratings if r >= 9)
    detractors = sum(1 for r in ratings if r <= 6)
    total = len(ratings)
    nps = ((promoters - detractors) / total) * 100
    
    return {
        "nps_score": round(nps),
        "csat_score": round(csat, 1)
    }


@router.post("/encuestas", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_encuesta(
    data: EncuestaSatisfaccionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    encuesta = EncuestaSatisfaccion(
        codigo=data.codigo,
        cliente_nombre=data.cliente_nombre,
        comentarios_generales=data.comentarios_generales,
        estado="enviada",
        tenant_id=current_user.tenant_id
    )
    db.add(encuesta)
    db.commit()
    db.refresh(encuesta)

    # Initialize questions
    for q_text in data.preguntas:
        pregunta = PreguntaEncuesta(
            encuesta_id=encuesta.id,
            pregunta_texto=q_text,
            calificacion=None,
            comentarios=None,
            tenant_id=current_user.tenant_id
        )
        db.add(pregunta)
    db.commit()
    db.refresh(encuesta)

    # Convert to response dict with metrics
    res_dict = {
        "id": encuesta.id,
        "codigo": encuesta.codigo,
        "cliente_nombre": encuesta.cliente_nombre,
        "fecha_envio": encuesta.fecha_envio,
        "fecha_respuesta": encuesta.fecha_respuesta,
        "estado": encuesta.estado,
        "comentarios_generales": encuesta.comentarios_generales,
        "tenant_id": encuesta.tenant_id,
        "preguntas": [
            {
                "id": p.id,
                "encuesta_id": p.encuesta_id,
                "pregunta_texto": p.pregunta_texto,
                "calificacion": p.calificacion,
                "comentarios": p.comentarios,
                "tenant_id": p.tenant_id
            } for p in encuesta.preguntas
        ],
        "nps_score": 0,
        "csat_score": 0.0
    }
    return res_dict


@router.get("/encuestas", response_model=List[Dict[str, Any]])
def list_encuestas(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    encuestas = db.query(EncuestaSatisfaccion).filter(
        EncuestaSatisfaccion.tenant_id == current_user.tenant_id
    ).order_by(EncuestaSatisfaccion.fecha_envio.desc()).all()

    response_list = []
    for e in encuestas:
        metrics = compute_survey_metrics(e)
        response_list.append({
            "id": e.id,
            "codigo": e.codigo,
            "cliente_nombre": e.cliente_nombre,
            "fecha_envio": e.fecha_envio,
            "fecha_respuesta": e.fecha_respuesta,
            "estado": e.estado,
            "comentarios_generales": e.comentarios_generales,
            "tenant_id": e.tenant_id,
            "preguntas": [
                {
                    "id": p.id,
                    "encuesta_id": p.encuesta_id,
                    "pregunta_texto": p.pregunta_texto,
                    "calificacion": p.calificacion,
                    "comentarios": p.comentarios,
                    "tenant_id": p.tenant_id
                } for p in e.preguntas
            ],
            **metrics
        })
    return response_list


@router.get("/encuestas/{id}", response_model=Dict[str, Any])
def get_encuesta(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    encuesta = db.query(EncuestaSatisfaccion).filter(
        EncuestaSatisfaccion.id == id,
        EncuestaSatisfaccion.tenant_id == current_user.tenant_id
    ).first()
    if not encuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la encuesta de satisfacción."
        )

    metrics = compute_survey_metrics(encuesta)
    return {
        "id": encuesta.id,
        "codigo": encuesta.codigo,
        "cliente_nombre": encuesta.cliente_nombre,
        "fecha_envio": encuesta.fecha_envio,
        "fecha_respuesta": encuesta.fecha_respuesta,
        "estado": encuesta.estado,
        "comentarios_generales": encuesta.comentarios_generales,
        "tenant_id": encuesta.tenant_id,
        "preguntas": [
            {
                "id": p.id,
                "encuesta_id": p.encuesta_id,
                "pregunta_texto": p.pregunta_texto,
                "calificacion": p.calificacion,
                "comentarios": p.comentarios,
                "tenant_id": p.tenant_id
            } for p in encuesta.preguntas
        ],
        **metrics
    }


@router.post("/encuestas/{id}/responder", response_model=Dict[str, Any])
def respond_encuesta(
    id: uuid.UUID,
    data: EncuestaResponder,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    encuesta = db.query(EncuestaSatisfaccion).filter(
        EncuestaSatisfaccion.id == id,
        EncuestaSatisfaccion.tenant_id == current_user.tenant_id
    ).first()
    if not encuesta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la encuesta de satisfacción especificada."
        )

    if encuesta.estado == "respondida":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta encuesta ya ha sido respondida."
        )

    # Process each question response
    respuestas_map = {r.pregunta_id: r for r in data.respuestas}
    
    for p in encuesta.preguntas:
        if p.id in respuestas_map:
            resp_item = respuestas_map[p.id]
            p.calificacion = resp_item.calificacion
            p.comentarios = resp_item.comentarios
            db.add(p)

    encuesta.comentarios_generales = data.comentarios_generales
    encuesta.fecha_respuesta = datetime.now(timezone.utc)
    encuesta.estado = "respondida"

    db.add(encuesta)
    db.commit()
    db.refresh(encuesta)

    metrics = compute_survey_metrics(encuesta)
    return {
        "id": encuesta.id,
        "codigo": encuesta.codigo,
        "cliente_nombre": encuesta.cliente_nombre,
        "fecha_envio": encuesta.fecha_envio,
        "fecha_respuesta": encuesta.fecha_respuesta,
        "estado": encuesta.estado,
        "comentarios_generales": encuesta.comentarios_generales,
        "tenant_id": encuesta.tenant_id,
        "preguntas": [
            {
                "id": p.id,
                "encuesta_id": p.encuesta_id,
                "pregunta_texto": p.pregunta_texto,
                "calificacion": p.calificacion,
                "comentarios": p.comentarios,
                "tenant_id": p.tenant_id
            } for p in encuesta.preguntas
        ],
        **metrics
    }
