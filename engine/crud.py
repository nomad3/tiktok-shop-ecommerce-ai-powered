from sqlalchemy.orm import Session
import models, schemas

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_slug(db: Session, slug: str):
    return db.query(models.Product).filter(models.Product.slug == slug).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    # Sort by trend_score descending by default for the "Urgency Feed"
    return db.query(models.Product).order_by(models.Product.trend_score.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product_scores(db: Session, product_id: int, trend_score: float, urgency_score: float):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product:
        product.trend_score = trend_score
        product.urgency_score = urgency_score
        db.commit()
        db.refresh(product)
    return product


# Trend Signal operations
def create_trend_signal(db: Session, signal: schemas.TrendSignalCreate):
    db_signal = models.TrendSignal(**signal.dict())
    db.add(db_signal)
    db.commit()
    db.refresh(db_signal)
    return db_signal


def get_trend_signals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TrendSignal).order_by(
        models.TrendSignal.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_trend_signals_by_source(db: Session, source: str, limit: int = 50):
    return db.query(models.TrendSignal).filter(
        models.TrendSignal.source == source
    ).order_by(models.TrendSignal.created_at.desc()).limit(limit).all()
