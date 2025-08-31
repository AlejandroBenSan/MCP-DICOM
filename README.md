# MCP-DICOM

A Model Context Protocol (MCP) server that provides DICOM (Digital Imaging and Communications in Medicine) file analysis capabilities.

## Features

- DICOM File Analysis
  - Extract and analyze DICOM file metadata
  - Get detailed information about DICOM studies
  - Folder-based DICOM analysis

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AlejandroBenSan/MCP-DICOM.git
```

2. Navigate to the project directory:
```bash
cd MCP-DICOM
```

3. Install dependencies:
```bash
npm install
```

4. Configure MCP integration:
   - Open or create your `mcp.json` file in VS Code
   - Add the following configuration, replacing the path with your project's main file location:
```json
{
    "servers": {
        "dicom": {
            "name": "MCP-DICOM",
            "description": "DICOM tools and utilities",
            "path": "/path/to/your/src/main.ts"
        }
    }
}
```

## Usage

More detailed usage instructions will be provided as the project develops.

## Requirements

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.
