# Model Defining Questions Database
from google.appengine.ext import db
class question(db.model):
	questionNumber = db.IntegerProperty(required=True)
	question = db.StringProperty(required=True)
	qimage = db.StringProperty(required=True)
	opt1 = db.db.StringProperty(required=True)
	opt2 = db.StringProperty(required=True)
	opt3 = db.StringProperty(required=True)
	opt4 = db.StringProperty(required=True)
	
