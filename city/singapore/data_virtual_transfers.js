// MRT fare-continuous pairs and separately ticketed Sentosa access are distinct maps.
const VIRTUAL_FREE_TRANSFER_MAP = {
  "NS21": [
    "DT11"
  ],
  "DT11": [
    "NS21"
  ],
  "BP6": [
    "DT1"
  ],
  "DT1": [
    "BP6"
  ],
  "EW2": [
    "DT32"
  ],
  "DT32": [
    "EW2"
  ]
};
const VIRTUAL_FREE_CONNECT_LINES = [
  {
    "from": "NS21",
    "to": "DT11"
  },
  {
    "from": "BP6",
    "to": "DT1"
  },
  {
    "from": "EW2",
    "to": "DT32"
  }
];
const VIRTUAL_TRANSFER_MAP = { CC29: ['SENTOSA_VIVO'], SENTOSA_VIVO: ['CC29'] };
const VIRTUAL_CONNECT_LINES = [];
