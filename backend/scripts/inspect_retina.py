# backend/scripts/inspect_retina.py
import torch
from pathlib import Path

path = Path("model_weights/retinal_efficientnetb0_best.pth")

print(f"File exists : {path.exists()}")
print(f"File size   : {path.stat().st_size / 1e6:.1f} MB")

ckpt = torch.load(path, map_location="cpu", weights_only=False)

print(f"\nType of checkpoint : {type(ckpt)}")

if isinstance(ckpt, dict):
    print(f"Top-level keys     : {list(ckpt.keys())}")
    print(f"Has model_state_dict: {'model_state_dict' in ckpt}")
    print(f"classes            : {ckpt.get('classes', 'NOT SAVED')}")
    print(f"num_classes        : {ckpt.get('num_classes', 'NOT SAVED')}")
    print(f"architecture       : {ckpt.get('architecture', 'NOT SAVED')}")

    # Get state dict
    state_dict = ckpt.get("model_state_dict", ckpt)
    classifier_keys = [k for k in state_dict.keys() if "classifier" in k]
    print(f"\nClassifier keys    : {classifier_keys}")

    # Detect architecture pattern
    if any(k == "classifier.1.0.weight" for k in state_dict):
        hidden = state_dict["classifier.1.0.weight"].shape[0]
        print(f"Head pattern       : Nested Sequential (hidden={hidden})")
    elif "classifier.1.weight" in state_dict and "classifier.4.weight" in state_dict:
        hidden = state_dict["classifier.1.weight"].shape[0]
        out    = state_dict["classifier.4.weight"].shape[0]
        print(f"Head pattern       : Flat Sequential (hidden={hidden}, out={out})")
    elif "classifier.1.weight" in state_dict:
        shape = state_dict["classifier.1.weight"].shape
        print(f"Head pattern       : Single Linear {shape}")
    else:
        print(f"Head pattern       : ⚠ UNKNOWN — all keys: {list(state_dict.keys())[:15]}")

elif isinstance(ckpt, torch.nn.Module):
    print("Checkpoint is a full model object (not state dict)")
else:
    print(f"Unexpected type: {type(ckpt)}")
