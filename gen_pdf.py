import subprocess, os

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if not os.path.exists(chrome_path):
        chrome_path = r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'

print(f'Using: {chrome_path}')
html_path = os.path.abspath('Echoes_Phone_7Day_Workbook_CN.html')
pdf_path = os.path.abspath('Echoes_Phone_7Day_Workbook_CN.pdf')

result = subprocess.run([
    chrome_path,
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    f'--print-to-pdf={pdf_path}',
    '--print-to-pdf-no-header',
    html_path
], capture_output=True, text=True, timeout=30)
print('stdout:', result.stdout)
print('stderr:', result.stderr[:500] if result.stderr else '')
print('return code:', result.returncode)
print('PDF exists:', os.path.exists(pdf_path))
