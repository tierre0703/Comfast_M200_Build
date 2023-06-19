#! /bin/sh

directory="./"

find "$directory" -type f -exec sh -c '
    for file do
        if file "$file" | grep -q "CRLF"; then
            #echo "$file"
            dos2unix "$file"
        fi
    done
' sh {} +