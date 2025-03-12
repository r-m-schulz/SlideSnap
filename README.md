# SlideSnap 🖼️

SlideSnap is a powerful web application that transforms PowerPoint presentations and PDF files into high-quality image galleries. Perfect for quickly extracting and sharing slides as images.

## Live Website 🌐

Access SlideSnap at: https://r-m-schulz.github.io/SlideSnap/

## Features ✨

- **Multi-Format Support**: Process both PowerPoint (.ppt, .pptx) and PDF files
- **Bulk Processing**: Convert entire presentations in one go
- **High-Quality Output**: Maintains image quality and clarity
- **Easy Download Options**:
  - Download individual slides
  - Download all slides as a ZIP file
- **User-Friendly Interface**:
  - Drag & drop upload
  - Click-to-browse option
  - Progress tracking
  - Compact mode after processing
- **Mobile Responsive**: Works seamlessly on all devices
- **iOS Support**: Special handling for iOS devices to save to camera roll

## Getting Started 🚀

### Prerequisites

- Python 3.x
- Flask
- Required Python packages (listed in requirements.txt)


#### Using the Web Version
Simply visit https://r-m-schulz.github.io/SlideSnap/ in your web browser. No installation required!

## Usage 📱

1. **Upload Your File**:
   - Drag and drop your PowerPoint or PDF file onto the upload area
   - Or click to browse and select your file
   - Maximum file size: 100MB

2. **Processing**:
   - Watch the progress bar as your file is processed
   - The upload area will compact once processing begins

3. **Managing Images**:
   - View all extracted slides in the gallery
   - Download individual slides by clicking their download buttons
   - Use "Download All" to get a ZIP of all slides
   - Use "Delete All" to clear the gallery and start fresh

4. **iOS Users**:
   - Special handling for saving images to camera roll
   - Follow on-screen instructions for iOS devices

## Technical Details 🛠️

- Built with Flask (Python web framework)
- Frontend: HTML5, CSS3, JavaScript
- Uses pdf2image for PDF processing
- Uses python-pptx for PowerPoint processing
- Responsive design with modern CSS features
- Client-side ZIP creation for bulk downloads

## Contributing 🤝

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License 📄

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). This is a strong copyleft license that requires anyone who distributes this code or a derivative work to make the source available under the same terms.

Key points of this license:
- You must disclose source code
- You must state changes made to the code
- You must distribute under the same license
- You must include a copy of the license and copyright notice
- You cannot hold the author liable

For more details, see the [LICENSE](LICENSE) file in this repository or visit [GNU GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html).

## Acknowledgments 🙏

- pdf2image library
- python-pptx library
- JSZip library
