from datetime import datetime

from app import db


class DiningTable(db.Model):
    """Restaurant table registry."""

    __tablename__ = 'dining_tables'

    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, unique=True, nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }


def ensure_default_tables(table_numbers=range(1, 21)):
    """Create the default restaurant table rows if they do not exist."""
    existing_numbers = {
        table.number
        for table in DiningTable.query.all()
    }

    created = False
    for number in table_numbers:
        if number in existing_numbers:
            continue

        db.session.add(DiningTable(number=number))
        created = True

    if created:
        db.session.commit()