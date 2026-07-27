"""
Seed major Indian cities mapped to states.
Run once after table is created.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, CityMaster, StateMaster

CITIES_BY_STATE = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Anantapur", "Eluru", "Ongole", "Kadapa", "Chittoor", "Machilipatnam", "Tenali", "Proddatur", "Hindupur"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Roing", "Tezu", "Along", "Namsai"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Goalpara", "Barpeta", "Karimganj", "Diphu", "Hailakandi"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Hajipur", "Sasaram", "Begusarai", "Katihar", "Chapra", "Arrah", "Munger", "Saharsa", "Motihari", "Bettiah", "Samastipur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Valpoi"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad", "Morbi", "Mehsana", "Bharuch", "Navsari", "Bhuj", "Palanpur", "Porbandar", "Valsad"],
    "Haryana": ["Chandigarh", "Faridabad", "Gurugram", "Panipat", "Ambala", "Karnal", "Sonipat", "Rohtak", "Hisar", "Yamunanagar", "Panchkula", "Bhiwani", "Sirsa", "Rewari", "Jind", "Kaithal", "Kurukshetra"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Manali", "Hamirpur", "Bilaspur", "Palampur", "Nahan", "Sundarnagar", "Chamba"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Dumka", "Phusro", "Sahebganj"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi", "Davangere", "Ballari", "Shivamogga", "Tumakuru", "Udupi", "Hassan", "Raichur", "Bidar", "Hospet", "Gadag", "Chitradurga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur", "Kottayam", "Malappuram", "Kasaragod", "Pathanamthitta", "Idukki", "Wayanad"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Burhanpur", "Khandwa", "Morena", "Bhind", "Chhindwara", "Guna", "Damoh"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur", "Ahmednagar", "Dhule", "Chandrapur", "Parbhani", "Ichalkaranji"],
    "Manipur": ["Imphal", "Bishnupur", "Thoubal", "Churachandpur", "Ukhrul", "Kakching", "Jiribam", "Tamenglong"],
    "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar", "Mairang"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Saiha"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Kiphire"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Kendujhar", "Phulbani"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Pathankot", "Moga", "Abohar", "Malerkotla", "Phagwara", "Barnala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Sri Ganganagar", "Pali", "Tonk", "Kishangarh", "Churu", "Hanumangarh", "Dhaulpur", "Beawar"],
    "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo", "Jorethang"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Dindigul", "Ranipet", "Sivakasi", "Kanchipuram", "Kumbakonam", "Cuddalore", "Nagercoil", "Rajapalayam", "Pollachi"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Khowai", "Belonia", "Ambassa", "Teliamura"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Ghaziabad", "Noida", "Meerut", "Bareilly", "Moradabad", "Aligarh", "Gorakhpur", "Saharanpur", "Firozabad", "Jhansi", "Ayodhya", "Mathura", "Muzaffarnagar", "Shahjahanpur", "Rampur", "Sitapur", "Unnao"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee", "Nainital", "Almora", "Pithoragarh", "Rudrapur", "Kashipur", "Kotdwar", "Mussoorie"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Kharagpur", "Haldia", "Krishnanagar", "Balurghat", "Cooch Behar", "Jalpaiguri", "Darjeeling", "Medinipur", "Basirhat", "Raiganj"],
    "Andaman and Nicobar Islands": ["Port Blair", "Havelock", "Neil Island", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar", "Kamorta"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh", "Connaught Place", "Lajpat Nagar", "Hauz Khas", "Pitampura", "Janakpuri", "Preet Vihar", "Patparganj"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Sopore", "Udhampur", "Rajouri", "Pulwama", "Kupwara", "Poonch", "Budgam"],
    "Ladakh": ["Leh", "Kargil", "Nubra", "Zanskar", "Drass"],
    "Lakshadweep": ["Kavaratti", "Minicoy", "Agatti", "Andrott", "Kalpeni"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
}

def seed_cities():
    app = create_app()
    with app.app_context():
        existing = CityMaster.query.count()
        if existing > 0:
            print(f"Already {existing} cities in DB. Skipping.")
            return

        total = 0
        for state_name, cities in CITIES_BY_STATE.items():
            state = StateMaster.query.filter_by(name=state_name).first()
            if not state:
                print(f"  WARNING: State '{state_name}' not found in DB, skipping")
                continue
            for city_name in cities:
                if CityMaster.query.filter_by(name=city_name, state_id=state.id).first():
                    continue
                db.session.add(CityMaster(name=city_name, state_id=state.id))
                total += 1
        db.session.commit()
        print(f"Seeded {total} cities.")

if __name__ == '__main__':
    seed_cities()