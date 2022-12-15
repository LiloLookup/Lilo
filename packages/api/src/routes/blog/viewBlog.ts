import {notFoundHTML} from "@core/api";
import {client} from "@core/redis";
import {Request, Response} from "express";
import FS from "node:fs";

export const viewBlog = async (req: Request, res: Response) => {
    const id = req.params.id;
    const blog = JSON.parse(await client.get(`blog:${id}`));

    if (!blog)
        return res.status(404).send(notFoundHTML);

    let blogHTML = FS.readFileSync(`${__dirname}/../../static/blog/view.html`, "utf-8");
    blogHTML = blogHTML.replace(/{title}/g, blog.title);
    blogHTML = blogHTML.replace(/{time}/g, blog.time);
    blogHTML = blogHTML.replace(/{message}/g, blog.message);
    return res.send(blogHTML);
}