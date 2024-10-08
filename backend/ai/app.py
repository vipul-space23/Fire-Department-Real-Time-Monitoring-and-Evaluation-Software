import os
import google.generativeai as genai
from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure the API key
genai.configure(api_key=os.getenv("API_KEY"))

# Create the model
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

@app.route('/')
def index():
    return render_template('index.html')  # Render the main page if needed

@app.route('/generate_report', methods=['POST'])
def generate_report():
    # Parse the form data sent from React
    data = request.json
    user_responses = {
        "building_name": data['buildingName'],
        "inspection_date": data['inspectionDate'],
        "inspector_name": data['inspectorName'],
        "fire_extinguishers": data['fireExtinguishers'],
        "fire_alarm_condition": data['fireAlarmCondition'],
        "exit_condition": data['exitCondition'],
        "comments_extinguishers": data['commentsExtinguishers'],
        "comments_alarms": data['commentsAlarms'],
    }

    # Generate report request
    report_request = (
        f"Generate a fire safety inspection report based on the following checklist:\n\n"
        f"**Building Name:** {user_responses['building_name']}\n"
        f"**Inspection Date:** {user_responses['inspection_date']}\n"
        f"**Inspector Name:** {user_responses['inspector_name']}\n\n"
        f"**Fire extinguishers present:** {'Yes' if user_responses['fire_extinguishers'] == '1' else 'No'}\n"
        f"**Fire alarm condition:** {['Functional', 'Partially Functional', 'Non-Functional'][int(user_responses['fire_alarm_condition']) - 1]}\n"
        f"**Overall condition of exits:** {user_responses['exit_condition']}\n"
        f"**Comments on fire extinguishers:** {user_responses['comments_extinguishers']}\n"
        f"**Comments on fire alarms:** {user_responses['comments_alarms']}\n\n"
        f"Please include:\n1. Inspection Summary\n2. Detailed Findings\n3. Risk Assessment\n4. Next Step"
    )

    # Start a new chat session
    chat_session = model.start_chat()

    # Send the request to the model
    response = chat_session.send_message(report_request)

    # Print the generated report
    report_output = response.text
    print(f'Report Generated:\n{report_output}')

    # Create a PDF of the report
    pdf_file = create_pdf(report_output, user_responses['building_name'])

    return send_file(pdf_file, as_attachment=True)

def create_pdf(report_output, building_name):
    # Use timestamp in filename to avoid overwriting
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pdf_file = f"fire_safety_inspection_report_{building_name}_{timestamp}.pdf"
    
    c = canvas.Canvas(pdf_file, pagesize=A4)
    width, height = A4  # Use A4 dimensions

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Fire Safety Inspection Report")

    # Add report content
    c.setFont("Helvetica", 12)
    lines = report_output.split('\n')
    y = height - 80
    for line in lines:
        # Replace Markdown-like formatting with proper formatting
        line = line.replace('**', '').replace('*', '•').replace('#', '')
        c.drawString(50, y, line)  # Adjust x position for better margins
        y -= 20  # Move down for the next line

        # Check if the y position is too low to add more lines
        if y < 50:  # If there is no more space, create a new page
            c.showPage()
            c.setFont("Helvetica-Bold", 16)
            c.drawString(100, height - 50, "Fire Safety Inspection Report")
            c.setFont("Helvetica", 12)
            y = height - 80  # Reset y position for new page

    c.save()
    print(f"PDF report generated: {pdf_file}")
    return pdf_file

if __name__ == '__main__':
    app.run(debug=True)
