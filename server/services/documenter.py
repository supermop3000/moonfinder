import sys
import json
from docx import Document
import spacy

nlp = spacy.load("en_core_web_sm")

# Define context clues to map text to company data keys
context_clues = {
    "Company Name": "companyName",
    "Industry": "industry",
    "Address": "address",
    "Phone": "phone",
    "Website": "website",
    "Revenue": "revenue",
    "Number of Employees": "employees",
    "Founded": "founded",
    "CEO": "ceo",
}

def infer_field(context_text, context_clues):
    """Infer the company data key based on the text context."""
    doc = nlp(context_text.lower())
    for clue, key in context_clues.items():
        if clue.lower() in doc.text:
            return key
    return None

def fill_blanks(doc_path, output_path, company_data, context_clues):
    """Fill blanks in the document based on the context."""
    doc = Document(doc_path)
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:  # Skip completely blank lines
            continue
        # Infer the key based on preceding context
        inferred_key = infer_field(text, context_clues)
        if inferred_key and inferred_key in company_data:
            paragraph.text = f"{text} {company_data[inferred_key]}"
    doc.save(output_path)
    print(f"Document processed and saved to: {output_path}")

if __name__ == "__main__":
    try:
        # Read arguments passed from Node.js
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        company_data = json.loads(sys.argv[3])
        
        # Fill blanks in the document
        fill_blanks(input_path, output_path, company_data, context_clues)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
