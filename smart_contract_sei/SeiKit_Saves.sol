// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SeiKit_Saves {
    uint8 public constant MAX_SAVES = 3;      
    uint8 public constant MAX_LAYERS = 6;     
    uint16 public constant MAX_BP = 10_000;   

    struct Mix {
        string scene;          
        string[] layers;       
        uint16[] volumesBP;    
        string uri;            
        bytes32 mixHash;       
        uint64 savedAt;        
    }

    mapping(address => mapping(uint8 => Mix)) private _saves;

    event Saved(address indexed user, uint8 indexed slot, bytes32 mixHash, string scene, string uri);
    event Cleared(address indexed user, uint8 indexed slot);

    function save(
        uint8 slot,
        string calldata scene,
        string[] calldata layers,
        uint16[] calldata volumesBP,
        string calldata uri
    ) external {
        _validateSlot(slot);
        _validateLayers(layers, volumesBP);

        bytes32 h = keccak256(abi.encode(scene, layers, volumesBP));

        Mix storage m = _saves[msg.sender][slot];

        delete m.layers;
        delete m.volumesBP;

        m.scene = scene;

        for (uint256 i = 0; i < layers.length; i++) {
            m.layers.push(layers[i]);
            m.volumesBP.push(volumesBP[i]);
        }
        m.uri = uri;
        m.mixHash = h;
        m.savedAt = uint64(block.timestamp);

        emit Saved(msg.sender, slot, h, scene, uri);
    }

    function clear(uint8 slot) external {
        _validateSlot(slot);
        Mix storage m = _saves[msg.sender][slot];
        require(m.savedAt != 0, "EMPTY");
        delete _saves[msg.sender][slot];
        emit Cleared(msg.sender, slot);
    }

    function loadMy(uint8 slot)
        external
        view
        returns (
            string memory scene,
            string[] memory layers,
            uint16[] memory volumesBP,
            string memory uri,
            bytes32 mixHash,
            uint64 savedAt
        )
    {
        return _load(msg.sender, slot);
    }

    function loadOf(address user, uint8 slot)
        external
        view
        returns (
            string memory scene,
            string[] memory layers,
            uint16[] memory volumesBP,
            string memory uri,
            bytes32 mixHash,
            uint64 savedAt
        )
    {
        return _load(user, slot);
    }

    function hasSave(address user, uint8 slot) external view returns (bool) {
        _validateSlot(slot);
        return _saves[user][slot].savedAt != 0;
    }

    function computeMixHash(
        string calldata scene,
        string[] calldata layers,
        uint16[] calldata volumesBP
    ) external pure returns (bytes32) {
        _staticValidateLayers(layers, volumesBP);
        return keccak256(abi.encode(scene, layers, volumesBP));
    }

    function maxSaves() external pure returns (uint8) { return MAX_SAVES; }
    function maxLayers() external pure returns (uint8) { return MAX_LAYERS; }
    function maxBasisPoints() external pure returns (uint16) { return MAX_BP; }

    function _load(address user, uint8 slot)
        internal
        view
        returns (
            string memory scene,
            string[] memory layers,
            uint16[] memory volumesBP,
            string memory uri,
            bytes32 mixHash,
            uint64 savedAt
        )
    {
        _validateSlot(slot);
        Mix storage m = _saves[user][slot];
        require(m.savedAt != 0, "EMPTY");

        scene = m.scene;
        uri = m.uri;
        mixHash = m.mixHash;
        savedAt = m.savedAt;

        uint256 n = m.layers.length;
        layers = new string[](n);
        volumesBP = new uint16[](n);
        for (uint256 i = 0; i < n; i++) {
            layers[i] = m.layers[i];
            volumesBP[i] = m.volumesBP[i];
        }
    }

    function _validateSlot(uint8 slot) internal pure {
        require(slot < MAX_SAVES, "BAD_SLOT");
    }

    function _validateLayers(string[] calldata layers, uint16[] calldata volumesBP) internal pure {
        _staticValidateLayers(layers, volumesBP);
        for (uint256 i = 0; i < volumesBP.length; i++) {
            require(volumesBP[i] <= MAX_BP, "BAD_VOLUME");
        }
    }

    function _staticValidateLayers(string[] calldata layers, uint16[] calldata volumesBP) internal pure {
        require(layers.length == volumesBP.length, "LEN_MISMATCH");
        require(layers.length <= MAX_LAYERS, "TOO_MANY_LAYERS");
    }
}