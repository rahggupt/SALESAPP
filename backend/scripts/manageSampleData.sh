#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: $0 [insert|rollback|create-admin]"
    echo "  insert      - Insert sample data into the database"
    echo "  rollback    - Remove sample data from the database"
    echo "  create-admin - Create default admin user"
    exit 1
}

# Check if command is provided
if [ $# -eq 0 ]; then
    show_usage
fi

# Execute based on command
case "$1" in
    "insert")
        echo "Inserting sample data..."
        node sampleData.js
        ;;
    "rollback")
        echo "Rolling back sample data..."
        node rollbackSampleData.js
        ;;
    "create-admin")
        echo "Creating admin user..."
        node createAdminUser.js
        ;;
    *)
        show_usage
        ;;
esac 