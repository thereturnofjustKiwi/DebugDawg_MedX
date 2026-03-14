# backend/scripts/verify_weights.py  ← update this script
import torch

weights = {
    "braintumor": "model_weights/braintumor_efficientnetb0.pth",
    "lungcolon":  "model_weights/lungcolon_efficientnetb0.pth",
    "pneumonia":  "model_weights/pneumonia_efficientnetb0.pth",
    "retina":     "model_weights/retinal_efficientnetb0_best.pth",
    "skincancer": "model_weights/skincancer_efficientnetb0.pth",
}

for disease, path in weights.items():
    ckpt = torch.load(path, map_location="cpu",weights_only=False)
    print(f"\n{'='*40}")
    print(f"Disease       : {disease}")
    print(f"Classes       : {ckpt.get('classes')}")
    print(f"Num classes   : {ckpt.get('num_classes')}")
    print(f"Accuracy      : {ckpt.get('test_accuracy', ckpt.get('accuracy', 'NOT SAVED'))}")
    print(f"Normalize mean: {ckpt.get('normalize_mean', 'NOT SAVED')}")
    print(f"Normalize std : {ckpt.get('normalize_std',  'NOT SAVED')}")
    print(f"Input size    : {ckpt.get('input_size')}")
    print(f"Architecture  : {ckpt.get('architecture')}")
