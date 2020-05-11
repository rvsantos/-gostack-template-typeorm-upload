import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface IRequest {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    category,
    type,
  }: IRequest): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    await this.isValidBalance(value, type);

    const transactionCategory = await this.findOrCreateCategory(category);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }

  private async findOrCreateCategory(title: string): Promise<Category> {
    const categoryRepository = getRepository(Category);

    let category = await categoryRepository.findOne({
      where: { title },
    });

    if (category) return category;

    category = categoryRepository.create({ title });
    await categoryRepository.save(category);

    return category;
  }

  private async isValidBalance(value: number, type: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const { total } = await transactionsRepository.getBalance();

    if (total < value && type === 'outcome')
      throw new AppError('You do not have enough balance');
  }
}

export default CreateTransactionService;
