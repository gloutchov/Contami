on run argv
  if (count of argv) is not 2 then error "ContaMi requires a source and destination path"
  set sourcePath to item 1 of argv
  set destinationPath to item 2 of argv
  tell application id "com.apple.Numbers"
    set importedDocument to open POSIX file sourcePath
    save importedDocument in POSIX file destinationPath
    close importedDocument saving no
  end tell
end run
