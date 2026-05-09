import PyPDF2

try:
    with open('hunarmand_pitch.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        with open('pdf_content.txt', 'w', encoding='utf-8') as out:
            for page in reader.pages:
                out.write(page.extract_text() + '\n---\n')
    print("Success")
except Exception as e:
    print(f"Error: {e}")
