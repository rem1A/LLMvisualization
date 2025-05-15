import numpy as np
def init(json_request):
    file_path = 'data/dict_optimizer_state_dict_dict_fp32_flat_groups_list_1.bin'
    data = np.fromfile(file_path, dtype=np.float32)
    return data.tolist()
