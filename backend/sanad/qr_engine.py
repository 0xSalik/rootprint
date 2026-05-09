import qrcode
from io import BytesIO

def generate_sanad_qr(sanad_id: str, base_url: str = "https://hunarmand.com/sanad/") -> bytes:
    """
    Generates a QR code image linking to the Sanad provenance page.
    Returns the image data as bytes (PNG).
    """
    url = f"{base_url}{sanad_id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to bytes buffer
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

if __name__ == "__main__":
    # Test generation
    qr_bytes = generate_sanad_qr("test-sanad-1234")
    with open("test_qr.png", "wb") as f:
        f.write(qr_bytes)
    print("Test QR code generated as test_qr.png")
