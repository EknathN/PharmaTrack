from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from ..database import SessionLocal
from ..models import Batch, Inventory, RoleEnum, Alert
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

def check_near_expiry():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        threshold_date = now + timedelta(days=settings.NEAR_EXPIRY_THRESHOLD_DAYS)
        
        # Find all inventory items that are close to expiring
        near_expiry_inventory = db.query(Inventory).join(Batch).filter(
            Batch.exp_date <= threshold_date,
            Inventory.status != 'disposed',
            Inventory.status != 'near_expiry',
            Inventory.quantity > 0
        ).all()
        
        for item in near_expiry_inventory:
            # Mark as near expiry
            item.status = 'near_expiry'
            
            # Create Alert for the owner
            alert = Alert(
                user_id=item.owner_id,
                message=f"Batch {item.batch.batch_number} ({item.batch.medicine_name}) is nearing expiry on {item.batch.exp_date.date()}.",
                type="near_expiry"
            )
            db.add(alert)
            
            # Also notify manufacturer if necessary (optional per business logic)
            manuf_alert = Alert(
                user_id=item.batch.manufacturer_id,
                message=f"Batch {item.batch.batch_number} currently with {item.owner_role.value} is nearing expiry.",
                type="near_expiry"
            )
            db.add(manuf_alert)
            
        if near_expiry_inventory:
            db.commit()
            logger.info(f"Processed {len(near_expiry_inventory)} near-expiry items.")
            
    except Exception as e:
        logger.error(f"Error checking near expiry: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run daily at midnight. For testing, we could run it every minute.
    scheduler.add_job(check_near_expiry, 'cron', hour=0, minute=0)
    scheduler.start()
    logger.info("Expiry checker background job started.")
