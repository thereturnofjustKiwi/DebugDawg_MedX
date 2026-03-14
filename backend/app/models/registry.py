MODEL_REGISTRY: dict = {
    "pneumonia": {
        "path": "model_weights/pneumonia_efficientnetb0.pth",
        "classes": ["NORMAL", "PNEUMONIA"],
        "num_classes": 2,
        "modality": "Chest X-Ray",
        "display_name": "Pneumonia",
    },
    "braintumor": {
        "path": "model_weights/braintumor_efficientnetb0.pth",
        "classes": ["glioma", "meningioma", "notumor", "pituitary"],
        "num_classes": 4,
        "modality": "MRI",
        "display_name": "Brain Tumor",
    },
    "skincancer": {
        "path": "model_weights/skincancer_efficientnetb0.pth",
        "classes": ["mel", "nv", "bcc", "akiec", "bkl", "df", "vasc"],
        "num_classes": 7,
        "modality": "Dermoscopy",
        "display_name": "Skin Cancer (HAM10000)",
    },
    "lungcolon": {
        "path": "model_weights/lungcolon_efficientnetb0.pth",
        "classes": ["colon_aca", "colon_n", "lung_aca", "lung_n", "lung_scc"],
        "num_classes": 5,
        "modality": "Histopathology",
        "display_name": "Lung & Colon Cancer",
    },
    "retina": {
        "path": "model_weights/retinal_efficientnetb0_best.pth",
        "classes": ["normal", "Retinal Disease"],
        "num_classes": 2,
        "modality": "Fundus Photography",
        "display_name": "Diabetic Retinopathy",
    },
    "bonefracture": {
        "path": "model_weights/bone_fracture_efficientnet_b0.pth",
        "classes": ["Fractured", "Non-Fractured"],  # alphabetical from folder names
        "num_classes": 2,
        "modality": "X-Ray",
        "display_name": "Bone Fracture",
    },
}                        # ← closing brace was missing