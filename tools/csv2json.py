import csv
import json
import sys


def csv_to_json(input_file, output_file):
    """
    将 CSV 文件转换为 JSON 文件。

    Args:
        input_file: CSV 文件路径。
        output_file: JSON 文件路径。
    """
    e = ["utf-8", "utf-8-sig", "ansi", "utf-16", "big5", None]
    en = False
    for enc in e:
        try:
            with open(input_file, "r", encoding=enc) as csvfile:
                csvfile.readline()
                en = enc
                break
        except Exception as ex:
            pass
    if en == False:
        print("unsupported codec, return without compiling")
        return
    print("guess", en)
    with open(input_file, "r", encoding=en) as csvfile, open(
        output_file, "w", encoding="utf-8"
    ) as jsonfile:
        reader = csv.DictReader(csvfile)
        data = []
        for row in reader:
            flag = 1
            for j in list(row.keys()):
                if row[j]:
                    flag = 0
                t = row[j]
                del row[j]
                if t != None and t != "":
                    row[j.lower()] = t
            if flag:
                continue
            # 将 CSV 列映射到 JSON 对象属性。
            c = row.get("command")
            if c == "Jump" and "arg1" in row:
                row["arg1"] = int(row["arg1"]) - 2
            if c == "If" and "arg2" in row:
                row["arg2"] = int(row["arg2"]) - 2
            print(row)
            data.append(row)

        # 将 JSON 对象写入文件。
        json.dump(data, jsonfile, indent=2, ensure_ascii=False)


# 获取命令行参数。
input_file = sys.argv[1]
output_file = f"{input_file.split('.')[0]}.json"

# 转换 CSV 文件并保存为 JSON 文件。
csv_to_json(input_file, output_file)

print(f"已将 CSV 文件 {input_file} 转换为 JSON 文件 {output_file}")
