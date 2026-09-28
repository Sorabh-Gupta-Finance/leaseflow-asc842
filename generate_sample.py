from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

out=Path(__file__).parent/'dist'/'sample-lease.pdf'
pdfmetrics.registerFont(TTFont('DemoSans','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DemoBold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
c=canvas.Canvas(str(out),pagesize=A4)
c.setTitle('LeaseFlow - fictional sample lease')
c.setAuthor('Sorabh Gupta | LeaseFlow demonstration')
W,H=A4
def base(page,subtitle):
 c.setFillColor(HexColor('#0d2037'));c.rect(0,H-94,W,94,fill=1,stroke=0)
 c.setFillColor(HexColor('#58e0c0'));c.setFont('DemoBold',11);c.drawString(45,H-34,'LEASEFLOW / SAMPLE DOCUMENT')
 c.setFillColor(HexColor('#ffffff'));c.setFont('DemoSans',18);c.drawString(45,H-64,subtitle)
 c.setFillColor(HexColor('#62748a'));c.setFont('DemoSans',8);c.drawString(45,35,'Fictional agreement for a portfolio demo. Not an executed legal document.')
 c.drawRightString(W-45,35,f'{page} / 2')
def line(y,text,bold=False):
 c.setFillColor(HexColor('#162b44'));c.setFont('DemoBold' if bold else 'DemoSans',9.8);c.drawString(45,y,text)
base(1,'Office lease - commercial terms')
y=H-130
rows=[('Document ID: DEMO-001',True),('1. Parties and premises',True),('Lessee: Larkbrook Software India Pvt Ltd',False),('Lessor: Meridian Estates Pvt Ltd',False),('Premises: Suite 402, Example Business Park, Noida, India',False),('2. Term and availability',True),('Commencement date: 2026-01-01',False),('Lease term: 36 months',False),('Expiry date: 2028-12-31',False),('The premises are available for use from the commencement date.',False),('3. Rent and concessions',True),('Monthly base rent: INR 100,000',False),('Annual fixed escalation: 5%',False),('Escalation applies on each commencement anniversary, compounded.',False),('Initial rent-free period: 3 months',False),('No base rent is payable for January, February or March 2026.',False),('Payment timing: Monthly in arrears',False),('Rent is due on the final calendar day of each month.',False),('Incentive received at commencement: INR 60,000',False),('The cash incentive is paid by the lessor on the commencement date.',False)]
for t,b in rows:
 line(y,t,b);y-=24 if b else 23
c.showPage();base(2,'Accounting assumptions and demo boundaries');y=H-130
rows=[('4. Scope confirmation',True),('Demo scope: Fixed rent; monthly arrears; no options; no modifications.',False),('No ownership transfer, purchase option or residual value guarantee.',False),('No CPI-linked rent, service components, deposits or indirect taxes.',False),('No amendments, impairments, subleases or foreign-currency transactions.',False),('5. Separate management inputs - not extracted lease terms',True),('Illustrative approved annual nominal IBR: 8%, compounded monthly.',False),('Monthly periodic rate: 8% / 12. No daily-rate convention is applied.',False),('Illustrative qualifying initial direct costs paid: INR 12,000.',False),('Prepaid rent at commencement: INR 0.',False),('Operating classification is a sample management assumption.',False),('An actual lease requires a documented ASC 842 classification assessment.',False),('6. How this demonstration works',True),('Download this PDF, then select Extract sample lease in LeaseFlow.',False),('A local template parser reads text and identifies eight labelled fields.',False),('Finance reviews the fields and enters the accounting assumptions.',False),('A deterministic engine calculates the schedules and journal proposals.',False),('No live AI model, OCR service, ERP posting or real approval is connected.',False),('All parties, premises and amounts in this document are fictional.',False)]
for t,b in rows:
 line(y,t,b);y-=27 if b else 24
c.save();print(out)
