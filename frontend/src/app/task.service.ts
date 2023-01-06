import { Injectable } from '@angular/core';
import mongoose from 'mongoose';
import { List } from './models/list.model';
import { Task } from './models/task.model';
import { WebRequestService } from './web-request.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(private webRequestService: WebRequestService) {}

  createList(title: string) {
    // Send web request to create list
    return this.webRequestService.post('lists', { title });
  }

  getLists() {
    return this.webRequestService.get('lists');
  }

  deleteList(id: string) {
    return this.webRequestService.delete(`lists/${id}`);
  }

  createTask(title: string, listId: string) {
    var id = new mongoose.Types.ObjectId(listId);
    console.log('List ID: ' + id);
    return this.webRequestService.post(`lists/${id}/tasks`, { title });
  }

  getTasks(listId: string) {
    var id = new mongoose.Types.ObjectId(listId);
    return this.webRequestService.get(`lists/${id}/tasks`);
  }

  complete(task: Task) {
    return this.webRequestService.patch(
      `lists/${task._listId}/tasks/${task._id}`,
      { completed: !task.completed }
    );
  }
}
