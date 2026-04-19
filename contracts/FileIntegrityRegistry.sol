// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FileIntegrityRegistry {
    struct FileRecord {
        string fileHash;
        string filename;
        uint256 size;
        uint256 recordedAt;
        address recordedBy;
    }

    mapping(string => FileRecord) private records;
    mapping(string => bool) private exists;

    event FileRecorded(
        string indexed fileHash,
        string filename,
        uint256 size,
        uint256 recordedAt,
        address indexed recordedBy
    );

    function recordFile(string calldata fileHash, string calldata filename, uint256 size) external {
        require(bytes(fileHash).length > 0, "fileHash is required");
        require(!exists[fileHash], "file hash already recorded");

        FileRecord memory newRecord = FileRecord({
            fileHash: fileHash,
            filename: filename,
            size: size,
            recordedAt: block.timestamp,
            recordedBy: msg.sender
        });

        records[fileHash] = newRecord;
        exists[fileHash] = true;

        emit FileRecorded(fileHash, filename, size, block.timestamp, msg.sender);
    }

    function getRecord(string calldata fileHash) external view returns (FileRecord memory) {
        require(exists[fileHash], "record not found");
        return records[fileHash];
    }

    function verifyFileHash(string calldata fileHash) external view returns (bool) {
        return exists[fileHash];
    }
}
