#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  seed             - Insert sample data into the database"
    echo "  rollback         - Remove sample data from the database"
    echo "  create-admin     - Create admin user"
    echo "  create-viewer    - Create viewer user"
    echo "  delete-medicines - Delete all medicines"
    echo "  drop-index      - Drop indexes"
}

# Check if a command is provided
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

# Execute command based on argument
case "$1" in
    "seed")
        node sampleData.js
        ;;
    "rollback")
        node rollbackSampleData.js
        ;;
    "create-admin")
        node createAdminUser.js
        ;;
    "create-viewer")
        node createViewerUser.js
        ;;
    "delete-medicines")
        node deleteSampleMedicines.js
        ;;
    "drop-index")
        node dropIndex.js
        ;;
    *)
        echo "Invalid command: $1"
        usage
        exit 1
        ;;
esac 