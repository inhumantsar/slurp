import words from "../assets/english-alpha.json";

export const getRandomName = () => {
    let name = "";
    while (name.length < 10) {
        if (name !== "") name += " ";
        const n = Math.floor(Math.random() * words.length);
        name += words[n].replace("_", " ");
    }
    return name;
};